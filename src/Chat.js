import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Chat.css';

const languageEmojis = {
  AR: "🇸🇦", BG: "🇧🇬", CS: "🇨🇿", DA: "🇩🇰", DE: "🇩🇪", EL: "🇬🇷", EN: "🇬🇧", ES: "🇪🇸",
  ET: "🇪🇪", FI: "🇫🇮", FR: "🇫🇷", HU: "🇭🇺", ID: "🇮🇩", IT: "🇮🇹", JA: "🇯🇵", KO: "🇰🇷",
  LT: "🇱🇹", LV: "🇱🇻", NB: "🇳🇴", NL: "🇳🇱", PL: "🇵🇱", PT: "🇵🇹", RO: "🇷🇴", RU: "🇷🇺",
  SK: "🇸🇰", SL: "🇸🇮", SV: "🇸🇪", TR: "🇹🇷", UK: "🇺🇦", ZH: "🇨🇳",
  'EN-GB': "🇬🇧", 'EN-US': "🇺🇸", 'PT-BR': "🇧🇷", 'PT-PT': "🇵🇹", 'ZH-HANS': "🇨🇳", 'ZH-HANT': "🇹🇼"
};

const sourceLanguages = ['AR', 'BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'ES', 'ET', 'FI', 'FR', 'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TR', 'UK', 'ZH'];
const targetLanguages = ['AR', 'BG', 'CS', 'DA', 'DE', 'EL', 'EN-GB', 'EN-US', 'ES', 'ET', 'FI', 'FR', 'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT-BR', 'PT-PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TR', 'UK', 'ZH-HANS', 'ZH-HANT'];

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputDisable, setInputDisable] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentSessionDocuments, setCurrentSessionDocuments] = useState([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('ES');
  const [targetLanguage, setTargetLanguage] = useState('EN-US');
  const [hoveredSourceLanguage, setHoveredSourceLanguage] = useState(null);
  const [hoveredTargetLanguage, setHoveredTargetLanguage] = useState(null);
  const fileInputRef = useRef(null);
  const sourceHoverTimeoutRef = useRef(null);
  const targetHoverTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedUsername = sessionStorage.getItem('username');
    
    if (storedAuth && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    } else {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/check-auth', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      setUsername(data.username);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('username', data.username);
    } catch (error) {
      setIsAuthenticated(false);
      setShowSignInModal(true);
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    const form = event.target;
    const { username, password } = form.elements;

    try {
      const response = await fetch('http://localhost:3001/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setUsername(username.value);
        setShowSignInModal(false);
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', username.value);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred while signing in. Please try again.');
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('username');
    setIsAuthenticated(false);
    setCurrentSessionDocuments([]);
    navigate('/');
  };

  const handlePersonalInfo = () => {
    navigate('/personal');
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleTranslate = () => {
    if (inputValue || selectedFile) {
      setShowLanguageModal(true);
    } else {
      alert('Please enter text or select a file to translate.');
    }
  };

  const confirmTranslation = async () => {
    setInputDisable(true);
    try {
      let response;
      let formData = new FormData();
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (inputValue) {
        const blob = new Blob([inputValue], { type: 'text/plain' });
        const file = new File([blob], `${inputValue.split(' ').slice(0, 2).join('_')}.txt`, { type: 'text/plain' });
        formData.append('file', file);
      } else {
        throw new Error('No file or text to translate');
      }

      formData.append('source_lang', sourceLanguage);
      formData.append('target_lang', targetLanguage);

      response = await fetch('http://localhost:3001/api/process-file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}, details: ${errorData.details}`);
      }

      const data = await response.json();
      setTranslatedContent(data);
      setCurrentSessionDocuments(prevDocs => [...prevDocs, {
        originalName: selectedFile ? selectedFile.name : `${inputValue.split(' ').slice(0, 2).join('_')}.txt`,
        translatedName: data.translatedFile,
        translatedContent: data.translatedText,
        sourceLanguage,
        targetLanguage
      }]);
    } catch (error) {
      console.error('Error translating:', error);
      alert(`Error translating: ${error.message}`);
    } finally {
      setInputDisable(false);
      setSelectedFile(null);
      setInputValue('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowLanguageModal(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (fileName) => {
    const encodedFileName = encodeURIComponent(fileName);
    window.location.href = `http://localhost:3001/api/download-file?fileName=${encodedFileName}`;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLanguageSelection = (type, lang) => {
    if (type === 'source') {
      setSourceLanguage(lang);
    } else {
      setTargetLanguage(lang);
    }
  };

  const handleSourceLanguageHover = (lang) => {
    clearTimeout(sourceHoverTimeoutRef.current);
    sourceHoverTimeoutRef.current = setTimeout(() => {
      setHoveredSourceLanguage(lang);
    }, 500);
  };

  const handleSourceLanguageHoverEnd = () => {
    clearTimeout(sourceHoverTimeoutRef.current);
    setHoveredSourceLanguage(null);
  };

  const handleTargetLanguageHover = (lang) => {
    clearTimeout(targetHoverTimeoutRef.current);
    targetHoverTimeoutRef.current = setTimeout(() => {
      setHoveredTargetLanguage(lang);
    }, 500);
  };

  const handleTargetLanguageHoverEnd = () => {
    clearTimeout(targetHoverTimeoutRef.current);
    setHoveredTargetLanguage(null);
  };

  return (
    <div className={`chat-page ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <i className="fas fa-bars"></i>
        </button>
        <Link to="/" className="sidebar-item sidebar-app">
          <i className="fas fa-home"></i><span>Home</span>
        </Link>
        <a href="#" className="sidebar-item sidebar-chat"><i className="fas fa-comments"></i><span>Chat</span></a>
        <Link to="/dashboard" className="sidebar-item sidebar-search active">
          <i className="fas fa-tachometer-alt"></i><span>Dashboard</span>
        </Link>
        <a href="#" className="sidebar-item sidebar-settings"><i className="fas fa-cog"></i><span>Settings</span></a>
      </nav>

      <main className={`chat-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="chat-header">
          <h1 className="chat-title">LegalLingo.ai</h1>
          {isAuthenticated && (
            <div className="user-dropdown">
              <div className="user-circle" onClick={handleDropdownToggle}>
                {username.charAt(0).toUpperCase()}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item dropdown-personal-info" onClick={handlePersonalInfo}>Personal Info</div>
                  <div className="dropdown-item dropdown-sign-out" onClick={handleSignOut}>Sign Out</div>
                </div>
              )}
            </div>
          )}
        </header>

        {showSignInModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">Sign In</h2>
              <h4 className="modal-subtitle">You must be signed in to use this page</h4>
              <form onSubmit={handleSignIn} className="signin-form">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  required
                  className="signin-input signin-username"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                  className="signin-input signin-password"
                />
                <button type="submit" className="signin-submit">Sign In</button>
              </form>
            </div>
          </div>
        )}

        {showLanguageModal && (
          <div className="modal-overlay">
            <div className="modal-content language-modal">
              <h2>Select Languages</h2>
              <div className="language-columns">
                <div className="language-column">
                  <h3>Source Language</h3>
                  <div className="language-grid">
                    {sourceLanguages.map(lang => (
                      <button 
                        key={lang} 
                        onClick={() => handleLanguageSelection('source', lang)}
                        className={`language-button ${sourceLanguage === lang ? 'selected' : ''}`}
                        onMouseEnter={() => handleSourceLanguageHover(lang)}
                        onMouseLeave={handleSourceLanguageHoverEnd}
                      >
                        <span className="language-emoji">{languageEmojis[lang]}</span>
                        {hoveredSourceLanguage === lang && <span className="language-name">{lang}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="language-column">
                  <h3>Target Language</h3>
                  <div className="language-grid">
                    {targetLanguages.map(lang => (
                      <button 
                        key={lang} 
                        onClick={() => handleLanguageSelection('target', lang)}
                        className={`language-button ${targetLanguage === lang ? 'selected' : ''}`}
                        onMouseEnter={() => handleTargetLanguageHover(lang)}
                        onMouseLeave={handleTargetLanguageHoverEnd}
                      >
                        <span className="language-emoji">{languageEmojis[lang]}</span>
                        {hoveredTargetLanguage === lang && <span className="language-name">{lang}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={confirmTranslation} className="confirmButton">Confirm</button>
              <button onClick={() => setShowLanguageModal(false)} className="confirmButton">Cancel</button>
            </div>
          </div>
        )}

        {!showSignInModal && (
          <div className="chat-content">
            <div className="message-list">
              {currentSessionDocuments.map((doc, index) => (
                <div key={index} className="message-item">
                  <p className="uploaded-doc">Uploaded: {doc.originalName}</p>
                  <p className="returned-doc">Translated: {doc.translatedName}</p>
                  <p className="language-info">From: {languageEmojis[doc.sourceLanguage]} To: {languageEmojis[doc.targetLanguage]}</p>
                  {doc.translatedContent && (
                    <p className="translated-content">{doc.translatedContent}</p>
                  )}
                  {doc.translatedName !== 'Translated text' && (
                    <button onClick={() => handleDownload(doc.translatedName)} className="download-btn">
                      Download Translated File
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="input-area">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={inputDisable}
                placeholder="Enter text to translate or upload a file"
                rows={3}
                className="input-textarea"
              />
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.docx,.pdf"
                ref={fileInputRef}
                style={{ display: 'none' }}
                className="file-input"
              />
              <div className="button-group">
                <button onClick={() => fileInputRef.current.click()} disabled={inputDisable} className="upload-btn">
                  Upload File
                </button>
                <button 
                  onClick={handleTranslate}
                  disabled={inputDisable || (!inputValue && !selectedFile)} 
                  className="process-btn"
                >
                  Translate
                </button>
              </div>
            </div>
            {selectedFile && (
              <div className="selected-file">
                <span className="file-name">Selected file: {selectedFile.name}</span>
                <button onClick={handleRemoveFile} className="remove-file-btn">×</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;