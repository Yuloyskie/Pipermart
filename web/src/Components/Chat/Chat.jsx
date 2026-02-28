import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chat.css';

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/v1/chat/chats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setChats(response.data.data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/chat/chats/${selectedChat._id}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/v1/chat/chats/${selectedChat._id}/messages`,
        { content: messageInput },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setMessageInput('');
      fetchMessages();
      fetchChats();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
    setMessages([]);
    setMessageInput('');
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="chat-widget-container">
      {!isOpen && (
        <button
          className="chat-float-btn"
          onClick={() => setIsOpen(true)}
          title="Open Chat"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
          <div className="chat-header">
            <h3>💬 Messages</h3>
            <div className="chat-controls">
              <button
                className="chat-minimize-btn"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? '▲' : '▼'}
              </button>
              <button
                className="chat-close-btn"
                onClick={() => {
                  setIsOpen(false);
                  handleCloseChat();
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chat-content">
                {selectedChat && (
                  <div className="chat-messages-view">
                    <div className="chat-messages-header">
                      <button className="back-btn" onClick={handleCloseChat}>
                        ← Back
                      </button>
                      <h4>
                        {selectedChat.participants?.find(p => p._id !== currentUser._id)?.name || 'Chat'}
                      </h4>
                    </div>

                    <div className="messages-list">
                      {messages.length === 0 ? (
                        <div className="no-messages">No messages yet. Start typing!</div>
                      ) : (
                        messages.map((msg) => {
                          if (!msg.sender) return null;
                          const senderId = msg.sender?._id || msg.sender;
                          const isSent = senderId === currentUser._id;
                          return (
                            <div
                              key={msg._id}
                              className={`message-item ${isSent ? 'sent' : 'received'}`}
                            >
                              <div className="message-content">
                                <p className="message-text">{msg.content || ''}</p>
                                <span className="message-time">
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ''}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="message-input-area">
                      <input
                        type="text"
                        className="message-input"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSendMessage();
                        }}
                        placeholder="Type a message..."
                      />
                      <button className="send-btn" onClick={handleSendMessage}>
                        📤
                      </button>
                    </div>
                  </div>
                )}

                {!selectedChat && (
                  <div className="chat-list">
                    {loading ? (
                      <div className="loading">Loading chats...</div>
                    ) : chats.length === 0 ? (
                      <div className="empty-state">No conversations yet. Start a conversation from the forum!</div>
                    ) : (
                      chats.map((chat) => {
                        const otherUser = chat.participants?.find(p => p._id !== currentUser._id);
                        return (
                          <div
                            key={chat._id}
                            className="chat-item"
                            onClick={() => setSelectedChat(chat)}
                          >
                            <div className="chat-avatar">
                              {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="chat-info">
                              <p className="chat-name">{otherUser?.name || 'Unknown User'}</p>
                              <p className="chat-preview">
                                {chat.lastMessage ? chat.lastMessage.substring(0, 30) + '...' : 'No messages yet'}
                              </p>
                            </div>
                            <span className="chat-time">
                              {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleDateString() : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
