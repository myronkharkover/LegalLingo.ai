import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PersonalInfo.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PersonalInfo = () => {
  const [userInfo, setUserInfo] = useState({
    username: '',
    password: '',
    companyName: '',
    email: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedUsername = sessionStorage.getItem('username');
    
    if (storedAuth && storedUsername) {
      setIsAuthenticated(true);
      setUserInfo(prevInfo => ({ ...prevInfo, username: storedUsername }));
      fetchUserInfo();
    } else {
      checkAuth();
    }
  }, []);

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
      setUserInfo(prevInfo => ({ ...prevInfo, username: data.username }));
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('username', data.username);
      fetchUserInfo();
    } catch (error) {
      setIsAuthenticated(false);
      setShowSignInModal(true);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user-info`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch user info: ${errorData.error}`);
      }
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error('Error fetching user info:', error.message);
    }
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    const form = event.target;
    const { username, password } = form.elements;

    try {
      const response = await fetch(`${API_URL}/api/signin`, {
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
        setUserInfo(prevInfo => ({ ...prevInfo, username: username.value }));
        setShowSignInModal(false);
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', username.value);
        fetchUserInfo();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred while signing in. Please try again.');
    }
  };


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEdit = (field) => {
    setEditingField(field);
  };

  const handleSave = async (field) => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/update-user-field`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ field, value: userInfo[field] }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error(`Failed to update ${field}:`, data);
        throw new Error(data.error || `Failed to update ${field}`);
      }
  
      setEditingField(null);
      // Refresh user info after successful update
      fetchUserInfo();
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/');
  };

  const renderField = (label, field) => {
    return (
      <div className="info-item">
        <label>{label}:</label>
        {editingField === field ? (
          <>
            <input
              type={field === 'password' ? 'password' : 'text'}
              name={field}
              value={userInfo[field]}
              onChange={handleChange}
            />
            <button onClick={() => handleSave(field)}>Save</button>
            <button onClick={() => setEditingField(null)}>Cancel</button>
          </>
        ) : (
          <>
            <span>
              {field === 'password'
                ? (showPassword ? (userInfo.password || '••••••••') : '••••••••')
                : userInfo[field]}
            </span>
            {field === 'password' && (
              <button onClick={togglePasswordVisibility}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}
            <button onClick={() => handleEdit(field)}>Edit</button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`personal-info-page ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
        <Link to="/dashboard" className="sidebar-item sidebar-search active">
          <i className="fas fa-tachometer-alt"></i><span>Dashboard</span>
        </Link>
        <Link to="/settings" className="sidebar-item sidebar-settings">
          <i className="fas fa-cog"></i><span>Settings</span>
        </Link>
      </nav>

      <main className={`personal-info-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="personal-info-header">
          <h1>LegalLingo.ai</h1>
          <h5>________________</h5>
          <h3>Personal Information</h3>
          {isAuthenticated && (
            <div className="user-dropdown">
              <div className="user-circle" onClick={handleDropdownToggle}>
                {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : ''}
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item dropdown-personal-info">Personal Info</div>
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
              <h4 className="modal-subtitle">You must be signed in to view personal information</h4>
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

        {isAuthenticated && (
          <div className="personal-info-content">
            {renderField('Username', 'username')}
            {renderField('Password', 'password')}
            {renderField('Company Name', 'companyName')}
            {renderField('Email', 'email')}
          </div>
        )}

        {error && <p className="error-message">{error}</p>}
      </main>
    </div>
  );
};

export default PersonalInfo;
