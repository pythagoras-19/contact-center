import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './App.css';
import { getChats, getMessagesForChat, sendMessageToChat, Chat, Message } from './api';

const sanitizeAndEncode = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      setError(null);
      try {
        const chatList = await getChats();
        setChats(chatList);
        if (chatList.length > 0) setActiveChatId(chatList[0].chatId);
      } catch (err) {
        setError('Failed to load chats');
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChatId) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const msgs = await getMessagesForChat(activeChatId);
        setMessages(msgs);
      } catch (err) {
        setError('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [activeChatId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && activeChatId) {
      try {
        await sendMessageToChat(activeChatId, 'Agent', messageInput);
        setMessageInput('');
        // Reload messages after sending
        const msgs = await getMessagesForChat(activeChatId);
        setMessages(msgs);
        // Reload chats after sending
        const chatList = await getChats();
        setChats(chatList);
      } catch (err) {
        setError('Failed to send message');
      }
    }
  };

  const getDisplayValue = (value: string) => {
    return sanitizeAndEncode(value);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">💬🔗</span>
            <h1>Connectly</h1>
            <span className="sparkle">✨</span>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-number">{chats.length}</span>
              <span className="stat-label">Chats</span>
            </div>
            <div className="stat">
              <span className="stat-number">🎯</span>
              <span className="stat-label">Ready to Help</span>
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>💭 Chats</h2>
            <div className="status-indicator online">
              <span className="status-dot"></span>
              Online & Ready! 🚀
            </div>
          </div>
          <div className="chat-list">
            {loadingChats ? (
              <div>Loading chats...</div>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.chatId}
                  className={`chat-item ${activeChatId === chat.chatId ? 'active' : ''}`}
                  onClick={() => setActiveChatId(chat.chatId)}
                >
                  <div className="chat-avatar">
                    <span className="avatar-emoji">💬</span>
                  </div>
                  <div className="chat-info">
                    <div className="chat-header">
                      <span className="customer-name">{sanitizeAndEncode(chat.customerName)}</span>
                      <span className="chat-time">{formatTime(chat.timestamp)}</span>
                    </div>
                    <p className="chat-preview">{sanitizeAndEncode(chat.message)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-area">
          {activeChatId ? (
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-customer-info">
                  <div className="customer-avatar">
                    <span className="avatar-emoji-large">💬</span>
                  </div>
                  <div>
                    <h3>{chats.find(c => c.chatId === activeChatId) && sanitizeAndEncode(chats.find(c => c.chatId === activeChatId)!.customerName)}</h3>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="action-btn" title="Call">📞</button>
                  <button className="action-btn" title="Email">📧</button>
                  <button className="action-btn" title="Transfer">🔄</button>
                  <button className="action-btn" title="Settings">⚙️</button>
                </div>
              </div>
              <div className="messages-container">
                {loadingMessages ? (
                  <div>Loading messages...</div>
                ) : (
                  messages.map(msg => (
                    <div className="message customer" key={msg.id}>
                      <div className="message-content">{sanitizeAndEncode(msg.message)}</div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="message-input-container">
                <div className="message-input-wrapper">
                  <input
                    type="text"
                    placeholder="Type your message... 💬"
                    className="message-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="send-btn" onClick={handleSendMessage}>
                    Send ✨
                  </button>
                </div>
                {messageInput && (
                  <div className="message-preview">
                    <small>Preview: {getDisplayValue(messageInput)}</small>
                  </div>
                )}
                <div className="quick-replies">
                  <button className="quick-reply">👋 Hello!</button>
                  <button className="quick-reply">👍 Thanks!</button>
                  <button className="quick-reply">🔍 Let me check</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="welcome-screen">
              <div className="welcome-content">
                <div className="welcome-icon">🎉</div>
                <h2>Welcome to Connectly! ✨</h2>
                <p>Select a chat from the sidebar to start helping customers</p>
                <div className="welcome-stats">
                  <div className="welcome-stat">
                    <span className="stat-icon">🎯</span>
                    <span>Ready to assist</span>
                  </div>
                  <div className="welcome-stat">
                    <span className="stat-icon">⭐</span>
                    <span>5-star service</span>
                  </div>
                  <div className="welcome-stat">
                    <span className="stat-icon">🚀</span>
                    <span>Super fast</span>
                  </div>
                </div>
                <div className="floating-elements">
                  <span className="floating-emoji">💬</span>
                  <span className="floating-emoji">✨</span>
                  <span className="floating-emoji">🎉</span>
                  <span className="floating-emoji">🌟</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="footer-icon">💬🔗</span>
              <span className="footer-text">Connectly</span>
            </div>
            <p className="footer-description">
              Professional customer support platform built with modern technologies
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Dashboard</a></li>
              <li><a href="#" className="footer-link">Analytics</a></li>
              <li><a href="#" className="footer-link">Settings</a></li>
              <li><a href="#" className="footer-link">Help</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">API Reference</a></li>
              <li><a href="#" className="footer-link">Contact Us</a></li>
              <li><a href="#" className="footer-link">Status</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Connect</h4>
            <div className="social-links">
              <a href="#" className="social-link" title="GitHub">📱</a>
              <a href="#" className="social-link" title="LinkedIn">💼</a>
              <a href="#" className="social-link" title="Twitter">🐦</a>
              <a href="#" className="social-link" title="Email">📧</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2025 <span className="author-name">Matt Christiansen</span>. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#" className="footer-bottom-link">Privacy Policy</a>
              <a href="#" className="footer-bottom-link">Terms of Service</a>
              <a href="#" className="footer-bottom-link">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 