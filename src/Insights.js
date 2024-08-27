import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './Insights.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Insights = () => {
  const { username, documentId, language } = useParams();
  const [document, setDocument] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedUsername = sessionStorage.getItem('username');
    
    if (storedAuth && storedUsername) {
      setIsAuthenticated(true);
      setCurrentUsername(storedUsername);
      fetchDocument();
    } else {
      checkAuth();
    }
  }, [username, documentId, language]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/check-auth`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      setIsAuthenticated(true);
      setCurrentUsername(data.username);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('username', data.username);
      fetchDocument();
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/');
    }
  };

  const fetchDocument = async () => {
    try {
      const response = await fetch(`${API_URL}/api/documents/${username}-${documentId}-${language}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      setError("Failed to fetch document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_URL}/api/signout`, {
        method: 'POST',
        credentials: 'include',
      });
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('username');
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Sign-out error:', error);
      alert('An error occurred while signing out. Please try again.');
    }
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: inputValue, 
            documentId: `${username}-${documentId}-${language}`,
            documentContent: document.content 
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to get chat response');
        }

        const data = await response.json();
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'user', message: inputValue },
          { sender: 'assistant', message: data.response },
        ]);
        setInputValue('');
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className={`insights-page ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
        <Link to="/dashboard" className="sidebar-item sidebar-search">
          <i className="fas fa-tachometer-alt"></i><span>Dashboard</span>
        </Link>
        <Link to="/settings" className="sidebar-item sidebar-settings">
          <i className="fas fa-cog"></i><span>Settings</span>
        </Link>
      </nav>

      <main className={`insights-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="insights-header">
          <h1>Document Insights</h1>
          {isAuthenticated && (
            <div className="user-dropdown">
              <div className="user-circle" onClick={handleDropdownToggle}>
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item dropdown-personal-info" onClick={() => navigate('/personal')}>Personal Info</div>
                  <div className="dropdown-item dropdown-sign-out" onClick={handleSignOut}>Sign Out</div>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="insights-content">
          <div className="document-view">
            {document && (
              <div>
                <h2>{language === document.target_language ? `translated-${document.document_name}` : document.document_name}</h2>
                <div className="document-content">
                  {document.content}
                </div>
              </div>
            )}
          </div>

          <div className="chat-view">
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`message ${message.sender}`}>
                  <span>{message.message}</span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Ask a question about the document..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Insights;