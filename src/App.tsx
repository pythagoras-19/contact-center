import React, { useState, useEffect } from 'react';
import './App.css';

interface ChatMessage {
  id: string;
  customerName: string;
  message: string;
  timestamp: Date;
  isNew: boolean;
  emoji: string;
  status: 'online' | 'away' | 'busy';
}

function App() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState<ChatMessage[]>([
    {
      id: '1',
      customerName: 'Sarah Johnson',
      message: 'Hi! I need help with my order #12345 🛍️',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isNew: true,
      emoji: '👩‍💼',
      status: 'online'
    },
    {
      id: '2',
      customerName: 'Mike Chen',
      message: 'When will my package arrive? 📦',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isNew: false,
      emoji: '👨‍💻',
      status: 'online'
    },
    {
      id: '3',
      customerName: 'Emma Davis',
      message: 'I want to return an item 🔄',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isNew: false,
      emoji: '👩‍🎨',
      status: 'away'
    },
    {
      id: '4',
      customerName: 'Alex Rivera',
      message: 'Thanks for the help! You\'re awesome! ⭐',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      isNew: false,
      emoji: '👨‍🎤',
      status: 'busy'
    }
  ]);

  // Simulate typing indicator
  useEffect(() => {
    if (activeChat) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [activeChat]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActiveChat = () => chats.find(chat => chat.id === activeChat);

  const handleSendMessage = () => {
    if (messageInput.trim() && activeChat) {
      // In a real app, this would send the message
      setMessageInput('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'busy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '🟢 Online';
      case 'away': return '🟡 Away';
      case 'busy': return '🔴 Busy';
      default: return '⚪ Offline';
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">💬✨</span>
            <h1>Contact Center</h1>
            <span className="sparkle">✨</span>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-number">{chats.length}</span>
              <span className="stat-label">Active Chats</span>
            </div>
            <div className="stat">
              <span className="stat-number">{chats.filter(c => c.isNew).length}</span>
              <span className="stat-label">New Messages</span>
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
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${activeChat === chat.id ? 'active' : ''} ${chat.isNew ? 'new' : ''}`}
                onClick={() => setActiveChat(chat.id)}
              >
                <div className="chat-avatar">
                  <span className="avatar-emoji">{chat.emoji}</span>
                  <div 
                    className="status-indicator-small"
                    style={{ backgroundColor: getStatusColor(chat.status) }}
                  ></div>
                </div>
                <div className="chat-info">
                  <div className="chat-header">
                    <span className="customer-name">{chat.customerName}</span>
                    <span className="chat-time">{formatTime(chat.timestamp)}</span>
                  </div>
                  <p className="chat-preview">{chat.message}</p>
                  {chat.isNew && <span className="new-badge">🆕 New</span>}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-area">
          {activeChat ? (
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-customer-info">
                  <div className="customer-avatar">
                    <span className="avatar-emoji-large">{getActiveChat()?.emoji}</span>
                    <div 
                      className="status-indicator-large"
                      style={{ backgroundColor: getStatusColor(getActiveChat()?.status || 'online') }}
                    ></div>
                  </div>
                  <div>
                    <h3>{getActiveChat()?.customerName}</h3>
                    <span className="customer-status">{getStatusText(getActiveChat()?.status || 'online')}</span>
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
                <div className="message customer">
                  <div className="message-content">
                    {getActiveChat()?.message}
                  </div>
                  <div className="message-time">
                    {getActiveChat() && formatTime(getActiveChat()!.timestamp)}
                  </div>
                </div>
                
                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">Customer is typing...</span>
                  </div>
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
                <h2>Welcome to Contact Center! ✨</h2>
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
    </div>
  );
}

export default App; 