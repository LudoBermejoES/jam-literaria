import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Session from './pages/Session';
import SessionPage from './pages/SessionPage';
import PostIdeasWaiting from './components/PostIdeasWaiting';
import VotingScreen from './components/VotingScreen';
import JoinSession from './pages/JoinSession';
import IdeaSubmission from './components/IdeaSubmission';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
    <Router>
          <div className="app-container">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/session/:sessionId" element={<Session />} />
                <Route path="/session/:sessionId/ideas" element={<IdeaSubmission />} />
                <Route path="/session/:sessionId/post-ideas" element={<PostIdeasWaiting />} />
                <Route path="/session/:sessionId/voting" element={<VotingScreen />} />
                <Route path="/join/:code" element={<JoinSession />} />
          </Route>
          
          {/* Redirect to home if no route matches */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </div>
        </Router>
      </SocketProvider>
      </AuthProvider>
  );
}

export default App;
