require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const session = require('express-session');
const AWS = require('aws-sdk');
const axios = require('axios');
const FormData = require('form-data');
const { OpenAI } = require("openai");

const app = express();
const port = 3001;

// app.use(cors({
//   origin: 'http://18.205.107.95:3000',
//   credentials: true
// }));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

const upload = multer({ dest: 'uploads/' });
const prisma = new PrismaClient();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const UPLOADED_DOCS_URL = process.env.UPLOADED_DOCS_URL;
const TRANSLATED_DOCS_URL = process.env.TRANSLATED_DOCS_URL;

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.username) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

app.post('/api/chat', isAuthenticated, async (req, res) => {
  try {
    const { message, documentId, documentContent } = req.body;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that answers questions about documents. Use the provided document content to answer the user's question." },
        { role: "user", content: `Document content: ${documentContent}\n\nQuestion: ${message}` }
      ],
    });

    const response = chatCompletion.choices[0].message.content;

    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Error processing chat request', details: error.message });
  }
});

app.get('/api/documents/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [username, docId, language] = id.split('-');

    const document = await prisma.documents.findFirst({
      where: {
        id: parseInt(docId),
        username: username
      },
      select: {
        id: true,
        document_name: true,
        document_returned: true,
        source_language: true,
        target_language: true
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const isTranslated = language === document.target_language;
    const documentKey = isTranslated ? document.document_returned : document.document_name;

    // Extract just the filename from the full URL and remove the "new-" prefix and random string
    const extractCleanFilename = (url) => {
      const parts = url.split('/');
      let filename = parts[parts.length - 1];
      // Remove "new-" prefix and the random string
      filename = filename.replace(/^new-[a-z0-9]+-(.*)/i, '$1');
      return filename;
    };

    const originalFilename = extractCleanFilename(document.document_name);
    const translatedFilename = extractCleanFilename(document.document_returned);

    const params = {
      Bucket: isTranslated ? process.env.TRANSLATED_BUCKET_NAME : process.env.UPLOAD_BUCKET_NAME,
      Key: documentKey.split('/').pop()
    };

    const s3Object = await s3.getObject(params).promise();
    const content = s3Object.Body.toString('utf-8');

    res.json({
      ...document,
      document_name: originalFilename,
      document_returned: `translated-${translatedFilename}`,
      content: content
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error fetching document', details: error.message });
  }
});

app.delete('/api/documents/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.session;

    const document = await prisma.documents.findFirst({
      where: {
        id: parseInt(id),
        username: username
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    // Delete from S3
    const originalKey = document.document_name.split('/').pop();
    const translatedKey = document.document_returned.split('/').pop();

    await s3.deleteObject({
      Bucket: process.env.UPLOAD_BUCKET_NAME,
      Key: originalKey
    }).promise();

    await s3.deleteObject({
      Bucket: process.env.TRANSLATED_BUCKET_NAME,
      Key: translatedKey
    }).promise();

    // Delete from database
    await prisma.documents.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error deleting document', details: error.message });
  }
});

app.post('/api/process-file', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const file = req.file;
    console.log('File received:', file.originalname);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), file.originalname);
    formData.append('source_lang', req.body.source_lang);
    formData.append('target_lang', req.body.target_lang);

    const uploadResponse = await axios.post('https://api-free.deepl.com/v2/document', formData, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        ...formData.getHeaders()
      }
    });

    const { document_id, document_key } = uploadResponse.data;

    let status = 'translating';
    while (status === 'translating' || status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await axios.post(`https://api-free.deepl.com/v2/document/${document_id}`, {
        document_key: document_key
      }, {
        headers: {
          'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
        }
      });

      status = statusResponse.data.status;
      console.log('Translation status:', status);
    }

    if (status !== 'done') {
      throw new Error('Translation failed');
    }

    const downloadResponse = await axios.post(`https://api-free.deepl.com/v2/document/${document_id}/result`, {
      document_key: document_key
    }, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
      },
      responseType: 'arraybuffer'
    });

    const username = req.session.username;
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const originalObjectKey = `${username}-${uniqueId}-${file.originalname}`;
    const translatedObjectKey = `${username}-translated-${uniqueId}-${file.originalname}`;

    await s3.upload({
      Bucket: process.env.UPLOAD_BUCKET_NAME,
      Key: originalObjectKey,
      Body: fs.createReadStream(file.path)
    }).promise();

    await s3.upload({
      Bucket: process.env.TRANSLATED_BUCKET_NAME,
      Key: translatedObjectKey,
      Body: downloadResponse.data
    }).promise();

    const document = await prisma.documents.create({
      data: {
        document_name: `${UPLOADED_DOCS_URL}${originalObjectKey}`,
        document_returned: `${TRANSLATED_DOCS_URL}${translatedObjectKey}`,
        source_language: req.body.source_lang,
        target_language: req.body.target_lang,
        username: username
      }
    });

    res.json({ 
      documentId: document.id,
      originalFile: file.originalname,
      translatedFile: `translated-${file.originalname}`
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file', details: error.message });
  } finally {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post('/api/folders', isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    const { username } = req.session;

    const folder = await prisma.folders.create({
      data: {
        name,
        username
      }
    });

    res.json({ success: true, folder });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Error creating folder', details: error.message });
  }
});

app.get('/api/folders', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.session;

    const folders = await prisma.folders.findMany({
      where: { username },
      select: {
        id: true,
        name: true
      }
    });

    res.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Error fetching folders', details: error.message });
  }
});

app.put('/api/documents/:id/move', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { folderId } = req.body;
    const { username } = req.session;

    const updatedDocument = await prisma.documents.updateMany({
      where: {
        id: parseInt(id),
        username
      },
      data: {
        folderId: folderId ? parseInt(folderId) : null
      }
    });

    if (updatedDocument.count === 0) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    res.json({ success: true, message: 'Document moved successfully' });
  } catch (error) {
    console.error('Error moving document:', error);
    res.status(500).json({ error: 'Error moving document', details: error.message });
  }
});

app.get('/api/documents', isAuthenticated, async (req, res) => {
  try {
    const { username } = req.session;
    
    const documents = await prisma.documents.findMany({
      where: { username: username },
      select: {
        id: true,
        document_name: true,
        document_returned: true,
        source_language: true,
        target_language: true,
        folderId: true
      },
      orderBy: { id: 'desc' }
    });
    
    const modifiedDocuments = documents.map(doc => {
      const originalNameParts = doc.document_name.split('/').pop().split('-');
      const originalName = originalNameParts.slice(2).join('-');

      const translatedNameParts = doc.document_returned.split('/').pop().split('-');
      const translatedName = translatedNameParts.slice(3).join('-');

      return {
        id: doc.id,
        originalName: originalName,
        translatedName: translatedName,
        originalUrl: doc.document_name,
        translatedUrl: doc.document_returned,
        sourceLanguage: doc.source_language,
        targetLanguage: doc.target_language,
        folderId: doc.folderId
      };
    });
    
    res.json({ documents: modifiedDocuments });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents', details: error.message });
  }
});

app.get('/api/download-file', isAuthenticated, async (req, res) => {
  const { fileName } = req.query;
  
  if (!fileName) {
    return res.status(400).json({ error: 'File name is required' });
  }

  try {
    const isTranslated = fileName.startsWith('translated-');
    const cloudFrontUrl = isTranslated ? TRANSLATED_DOCS_URL : UPLOADED_DOCS_URL;
    
    const originalFileName = isTranslated ? fileName.replace('translated-', '') : fileName;

    const document = await prisma.documents.findFirst({
      where: {
        OR: [
          { document_name: { endsWith: originalFileName } },
          { document_returned: { endsWith: fileName } }
        ],
        username: req.session.username
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fullUrl = isTranslated ? document.document_returned : document.document_name;

    res.redirect(fullUrl);
  } catch (error) {
    console.error('Error processing download:', error);
    res.status(500).json({ error: 'Error processing download', details: error.message });
  }
});

app.post('/api/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: { username: username },
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.session.username = user.username;

    res.json({ success: true, message: 'Sign in successful' });
  } catch (error) {
    console.error('Error during sign in:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.post('/api/signup', async (req, res) => {
  const { username, password, companyName, email } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({
      where: { username: username },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.users.create({
      data: {
        username: username,
        password: hashedPassword,
        user_profile: {
          create: {
            company_name: companyName,
            email: email
          }
        }
      },
    });

    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error during sign up:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.username) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

app.post('/api/request-demo', async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, additionalInfo } = req.body;

    const demoRequest = await prisma.demo_requests.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        company_name: companyName,
        additional_info: additionalInfo
      }
    });

    res.json({ success: true, message: 'Demo request submitted successfully', demoRequest });
  } catch (error) {
    console.error('Error submitting demo request:', error);
    res.status(500).json({ success: false, message: 'Error submitting demo request', error: error.message });
  }
});

app.post('/api/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error signing out' });
    }
    res.json({ success: true, message: 'Sign out successful' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});