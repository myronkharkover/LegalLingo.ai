import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const languageEmojis = {
  AR: "🇸🇦", BG: "🇧🇬", CS: "🇨🇿", DA: "🇩🇰", DE: "🇩🇪", EL: "🇬🇷", EN: "🇬🇧", ES: "🇪🇸",
  ET: "🇪🇪", FI: "🇫🇮", FR: "🇫🇷", HU: "🇭🇺", ID: "🇮🇩", IT: "🇮🇹", JA: "🇯🇵", KO: "🇰🇷",
  LT: "🇱🇹", LV: "🇱🇻", NB: "🇳🇴", NL: "🇳🇱", PL: "🇵🇱", PT: "🇵🇹", RO: "🇷🇴", RU: "🇷🇺",
  SK: "🇸🇰", SL: "🇸🇮", SV: "🇸🇪", TR: "🇹🇷", UK: "🇺🇦", ZH: "🇨🇳",
  'EN-GB': "🇬🇧", 'EN-US': "🇺🇸", 'PT-BR': "🇧🇷", 'PT-PT': "🇵🇹", 'ZH-HANS': "🇨🇳", 'ZH-HANT': "🇹🇼"
};

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('nameAsc');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedUsername = sessionStorage.getItem('username');
    
    if (storedAuth && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      fetchDocuments();
      fetchFolders();
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
      fetchDocuments();
    } catch (error) {
      setIsAuthenticated(false);
      navigate('/');
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/documents', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.documents);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again later.');
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/folders', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      const data = await response.json();
      setFolders(data.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const response = await fetch('http://localhost:3001/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newFolderName.trim() }),
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to create folder');
        }
        fetchFolders();
        setShowFolderModal(false);
        setNewFolderName('');
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const handleMoveToFolder = async (documentId, folderId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to move document');
      }
      fetchDocuments();
    } catch (error) {
      console.error('Error moving document:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (e) => {
    setSortOption(e.target.value);
  };

  const sortDocuments = (docs) => {
    switch (sortOption) {
      case 'nameAsc':
        return [...docs].sort((a, b) => a.originalName.localeCompare(b.originalName));
      case 'nameDesc':
        return [...docs].sort((a, b) => b.originalName.localeCompare(a.originalName));
      case 'languageAsc':
        return [...docs].sort((a, b) => a.sourceLanguage.localeCompare(b.sourceLanguage));
      case 'languageDesc':
        return [...docs].sort((a, b) => b.sourceLanguage.localeCompare(a.sourceLanguage));
      default:
        return docs;
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/signout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Sign out failed');
      }
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('username');
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handlePersonalInfo = () => {
    navigate('/personal');
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleDownload = (fileName, isTranslated) => {
    window.location.href = `http://localhost:3001/api/download-file?fileName=${encodeURIComponent(fileName)}`;
  };

  const handleInsights = (documentId, language, isTranslated) => {
    const selectedLanguage = isTranslated ? language : documents.find(doc => doc.id === documentId).sourceLanguage;
    navigate(`/insights/${username}/${documentId}/${selectedLanguage}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const filteredAndSortedDocuments = sortDocuments(
    documents.filter(doc => 
      (currentFolder ? doc.folderId === currentFolder : true) &&
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className={`dashboard-page ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button onClick={toggleSidebar} className="sidebar-toggle">
          <i className="fas fa-bars"></i>
        </button>
        <Link to="/" className="sidebar-item sidebar-app">
          <i className="fas fa-home"></i><span>Home</span>
        </Link>
        <Link to="/chat" className="sidebar-item sidebar-chat">
          <i className="fas fa-comments"></i><span>Chat</span>
        </Link>
        <Link to="/dashboard" className="sidebar-item sidebar-dashboard active">
          <i className="fas fa-tachometer-alt"></i><span>Dashboard</span>
        </Link>
        <a href="#" className="sidebar-item sidebar-settings">
          <i className="fas fa-cog"></i><span>Settings</span>
        </a>
      </nav>

      <main className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="dashboard-header">
          <h1>Your Documents</h1>
          {isAuthenticated && (
            <div className="user-dropdown">
              <div className="user-circle" onClick={handleDropdownToggle}>
                {username.charAt(0).toUpperCase()}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={handlePersonalInfo}>Personal Info</div>
                  <div className="dropdown-item" onClick={handleSignOut}>Sign Out</div>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="dashboard-content">
          <div className="top-controls">
            <div className="search-sort">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              <button onClick={() => setShowFolderModal(true)} className="create-folder-btn">
                Create Folder
              </button>
            </div>
            <div className="folder-controls">
              <select 
                onChange={(e) => setCurrentFolder(e.target.value ? Number(e.target.value) : null)}
                value={currentFolder || ''}
                className="folder-select"
              >
                <option value="">All Documents</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
              <select value={sortOption} onChange={handleSort} className="sort-select">
                <option value="nameAsc">Name A-Z</option>
                <option value="nameDesc">Name Z-A</option>
                <option value="languageAsc">Language A-Z</option>
                <option value="languageDesc">Language Z-A</option>
              </select>
            </div>
          </div>

          <Link to="/chat" className="upload-link">Upload New Document</Link>
          
          <div className="document-grid">
            {filteredAndSortedDocuments.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="document-preview">
                  <div className="original-doc">
                    <h3>Original {languageEmojis[doc.sourceLanguage]}</h3>
                    <button onClick={() => handleDownload(doc.originalName, false)}>Download</button>
                    <button className="insights-btn" onClick={() => handleInsights(doc.id, doc.sourceLanguage, false)}>Insights</button>
                  </div>
                  <div className="translated-doc">
                    <h3>Translated {languageEmojis[doc.targetLanguage]}</h3>
                    <button onClick={() => handleDownload(doc.translatedName, true)}>Download</button>
                    <button className="insights-btn" onClick={() => handleInsights(doc.id, doc.targetLanguage, true)}>Insights</button>
                  </div>
                </div>
                <div className="document-footer">
                  <span className="file-name">{doc.originalName}</span>
                  <select 
                    onChange={(e) => handleMoveToFolder(doc.id, e.target.value)}
                    value={doc.folderId || ''}
                    className="move-to-folder"
                  >
                    <option value="">Move to folder</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showFolderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Folder Name</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
            />
            <div className="modal-actions">
              <button onClick={handleCreateFolder}>Create</button>
              <button onClick={() => setShowFolderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;