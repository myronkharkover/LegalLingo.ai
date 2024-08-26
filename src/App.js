import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import Benefits from './Benefits';
import Features from './Features';
import Pricing from './Pricing';
import Chat from './Chat';
import Insights from './Insights';
import Research from './Research';
import PersonalInfo from './PersonalInfo';
import Dashboard from './Dashboard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try refreshing the page.</h1>;
    }
    return this.props.children; 
  }
}

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/check-auth', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : null;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/research" element={<Research />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/insights/:username/:documentId/:language" element={<Insights />} />
          <Route path="/insights/:documentId" element={<OldInsightsRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal" element={<PersonalInfo />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

// This component will handle redirects from the old URL format to the new one
function OldInsightsRedirect() {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username') || localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    } else {
      navigate('/');
    }
  }, []);

  useEffect(() => {
    if (username) {
      fetchDocumentDetails();
    }
  }, [username, documentId]);

  const fetchDocumentDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/documents/${documentId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch document details');
      }
      const data = await response.json();
      navigate(`/insights/${username}/${documentId}/${data.source_language}`, { replace: true });
    } catch (error) {
      console.error('Error fetching document details:', error);
      navigate('/dashboard');
    }
  };

  return <div>Redirecting...</div>;
}

function AppContent() {
  const [isSignInModalOpen, setSignInModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [isRequestDemoModalOpen, setRequestDemoModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  const navigate = useNavigate();

  const openSignInModal = () => setSignInModalOpen(true);
  const closeSignInModal = () => {
    setSignInModalOpen(false);
    setUsername('');
    setPassword('');
    setSignInError('');
  };

  const openCreateAccountModal = () => setCreateAccountModalOpen(true);
  const closeCreateAccountModal = () => {
    setCreateAccountModalOpen(false);
    setUsername('');
    setPassword('');
    setCompanyName('');
    setEmail('');
    setSignUpError('');
    setSignUpSuccess('');
  };

  const openRequestDemoModal = () => setRequestDemoModalOpen(true);
  const closeRequestDemoModal = () => {
    setRequestDemoModalOpen(false);
  };


  const handleSignIn = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        // Store authentication state and username in sessionStorage
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', username);

        // Navigate to the chat page upon successful sign-in
        navigate('/chat');
      } else {
        setSignInError(data.message);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setSignInError('An error occurred while signing in. Please try again.');
    }
  };

  

  const handleSignUp = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, companyName, email }),
      });

      const data = await response.json();

      if (data.success) {
        setSignUpSuccess('Account created successfully!');
        closeCreateAccountModal();
      } else {
        setSignUpError(data.message);
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      setSignUpError('An error occurred while creating an account. Please try again.');
    }
  };

  const handleRequestDemo = (event) => {
    event.preventDefault();
    // Implement the demo request logic here
    console.log('Demo requested');
    closeRequestDemoModal();
  };

  const handleClickOutside = (event) => {
    if (event.target.classList.contains('modal')) {
      if (isCreateAccountModalOpen) {
        closeCreateAccountModal();
      } else if (isSignInModalOpen) {
        closeSignInModal();
      } else if (isRequestDemoModalOpen) {
        closeRequestDemoModal();
      }
    }
  };

  return (
    <div className="app-container">
      <header>
        <nav className="navbar">
          <div className="logo">LegalLingo</div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#cows">Benefits</a></li>
            <li><a href="#security">Security</a></li>
            <li><Link to="/research">Research</Link></li>
            <li><button className="sign-in-button" onClick={openSignInModal}>Sign In</button></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="hero">
          <h1>Transform Legal Documents with AI</h1>
          <p>LegalLingo uses advanced AI to simplify and translate complex legal jargon.</p>
          <button className="cta-button" onClick={openRequestDemoModal}>
            Get Started
          </button>
        </section>

        <section id="features" className="features">
          <h2>Features</h2>
          <Features />
        </section>

        <section id="cows" className="cows">
          <h2>Benefits</h2>
          <Benefits />
        </section>

        <section id="security" className="security">
          <h2>Security</h2>
          <Pricing />
        </section>

        <section className="cta">
          <h2>Ready to simplify your legal documents?</h2>
          <button className="cta-button" onClick={openRequestDemoModal}>
            Request a Demo
          </button>
        </section>

        {/* Sign In Modal */}
        {isSignInModalOpen && (
          <div className="modal" onClick={handleClickOutside}>
            <div className="modal-content">
              <button className="modal-close-button" onClick={closeSignInModal}>
                &times;
              </button>
              <h2>Sign In</h2>
              <form onSubmit={handleSignIn}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {signInError && <p className="error-message">{signInError}</p>}
                <button type="submit">Sign In</button>
              </form>
              <button className="create-account-button" onClick={openCreateAccountModal}>
                Create New Account
              </button>
            </div>
          </div>
        )}

        {/* Create Account Modal */}
        {isCreateAccountModalOpen && (
          <div className="modal" onClick={handleClickOutside}>
            <div className="modal-content">
              <button className="modal-close-button" onClick={closeCreateAccountModal}>
                &times;
              </button>
              <h2>Create Account</h2>
              <form onSubmit={handleSignUp}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {signUpError && <p className="error-message">{signUpError}</p>}
                {signUpSuccess && <p className="success-message">{signUpSuccess}</p>}
                <button type="submit">Create Account</button>
              </form>
            </div>
          </div>
        )}

        {/* Request Demo Modal */}
        {isRequestDemoModalOpen && (
          <div className="modal" onClick={handleClickOutside}>
            <div className="modal-content">
              <button className="modal-close-button" onClick={closeRequestDemoModal}>
                &times;
              </button>
              <h2>Request a Demo</h2>
              <form onSubmit={handleRequestDemo}>
                <input type="text" placeholder="First Name" required />
                <input type="text" placeholder="Last Name" required />
                <input type="email" placeholder="Email" required />
                <input type="text" placeholder="Company Name" required />
                <textarea className="request-demo-form" placeholder="Additional Info (Optional)"></textarea>
                <button type="submit">Submit</button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2024 LegalLingo. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;