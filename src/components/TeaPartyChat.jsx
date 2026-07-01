import React, { useState, useEffect, useRef } from 'react'
import { getLocalImagePath, getCardImagePath } from '../mock/data'
import { streamCommentary } from '../api/content'
import { analyzeAttitude, ATTITUDE_CONFIG } from '../utils/opinionAnalyzer'
import './TeaPartyChat.css'

function TeaPartyChat({ news, perspectives, onClose }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [imageLoadError, setImageLoadError] = useState({})
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const initializedRef = useRef(false) // 防止重复初始化

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!news || !perspectives || initializedRef.current) return
    initializedRef.current = true // 标记已初始化

    const initialMessages = [
      {
        id: 'system-1',
        type: 'system',
        content: '🍵 茶话会开始啦！大家围坐在一起，聊聊这条新闻~',
        time: getCurrentTime()
      },
      {
        id: 'news-1',
        type: 'news',
        news: news,
        time: getCurrentTime()
      }
    ]

    setMessages(initialMessages)

    // 依次让每个角色发言，流式输出
    let delay = 600
    perspectives.forEach((p, idx) => {
      setTimeout(() => {
        const msgId = 'role-' + idx + '-' + p.name
        setIsTyping(p.name)

        const fallbackText = '这件事吧，我觉得挺有意思的。从我的角度来看，确实值得好好聊聊。'

        // 先添加占位消息
        setMessages(prev => [...prev, {
          id: msgId,
          type: 'role',
          perspective: p,
          content: '正在输入...',
          attitude: 'neutral',
          time: getCurrentTime(),
          isStreaming: true,
        }])

        let fullContent = ''
        let hasReceivedChunk = false
        let settled = false // 是否已完成（成功/失败）
        let firstChunkTimer = null
        let totalTimer = null
        let eventSource = null

        const doFallback = () => {
          if (settled) return
          settled = true
          if (eventSource) { try { eventSource.close() } catch (_) {} }
          if (firstChunkTimer) clearTimeout(firstChunkTimer)
          if (totalTimer) clearTimeout(totalTimer)
          const analysis = analyzeAttitude(fallbackText)
          setMessages(prev => prev.map(msg =>
            msg.id === msgId
              ? { ...msg, content: fallbackText, attitude: analysis.attitude, isStreaming: false }
              : msg
          ))
          setIsTyping(false)
        }

        const doSuccess = (text) => {
          if (settled) return
          settled = true
          if (firstChunkTimer) clearTimeout(firstChunkTimer)
          if (totalTimer) clearTimeout(totalTimer)
          const finalText = text && text.trim().length > 0 ? text : fallbackText
          const analysis = analyzeAttitude(finalText)
          setMessages(prev => prev.map(msg =>
            msg.id === msgId
              ? { ...msg, content: finalText, attitude: analysis.attitude, isStreaming: false }
              : msg
          ))
          setIsTyping(false)
        }

        try {
          eventSource = streamCommentary(news.id, p.name, {
            onChunk: (chunk) => {
              if (settled) return
              hasReceivedChunk = true
              fullContent += chunk
              setMessages(prev => prev.map(msg =>
                msg.id === msgId ? { ...msg, content: fullContent } : msg
              ))
            },
            onDone: (finalContent) => {
              doSuccess(finalContent)
            },
            onError: (e) => {
              console.error('茶话会流式输出失败:', e)
              doFallback()
            }
          }, 'short')

          // 首次内容超时：10秒内没收到第一个 chunk，认为失败
          firstChunkTimer = setTimeout(() => {
            if (!hasReceivedChunk && !settled) {
              console.warn('茶话会首字节超时:', p.name)
              doFallback()
            }
          }, 10000)

          // 总超时：40秒
          totalTimer = setTimeout(() => {
            if (!settled) {
              console.warn('茶话会总超时:', p.name)
              doFallback()
            }
          }, 40000)

        } catch (e) {
          console.error('茶话会发言错误:', e)
          doFallback()
        }
      }, delay)
      delay += 1800
    })
  }, [news, perspectives])

  const getCurrentTime = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  const getAvatarUrl = (p) => {
    const cardKey = `card_${p.local_image}`
    const localKey = `local_${p.local_image}`
    if (p.card_image && !imageLoadError[cardKey]) {
      return { url: getCardImagePath(p.card_image), isCard: true, key: cardKey }
    }
    if (p.local_image && !imageLoadError[localKey]) {
      return { url: getLocalImagePath(p.local_image), isCard: false, key: localKey }
    }
    return null
  }

  const handleAvatarError = (key) => {
    setImageLoadError(prev => ({ ...prev, [key]: true }))
  }

  const renderAvatar = (p, size = 'normal') => {
    const avatar = getAvatarUrl(p)
    const className = size === 'small' ? 'chat-avatar-small' : 'chat-avatar'
    if (avatar) {
      return (
        <img
          src={avatar.url}
          alt={p.name}
          className={className}
          onError={() => handleAvatarError(avatar.key)}
        />
      )
    }
    return <span className="chat-emoji">{p.emoji}</span>
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: 'user-' + Date.now(),
      type: 'user',
      content: inputText.trim(),
      time: getCurrentTime()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')

    setTimeout(() => {
      const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)]
      setIsTyping(randomPerspective.name)

      const replyId = 'reply-' + Date.now()
      const fallbackText = '嗯，这个话题挺有意思的，让我想想...其实从我的角度来看，这件事还挺值得深思的。'

      // 先添加回复占位
      setMessages(prev => [...prev, {
        id: replyId,
        type: 'role',
        perspective: randomPerspective,
        content: '正在输入...',
        attitude: 'neutral',
        time: getCurrentTime(),
        isReply: true,
        isStreaming: true,
      }])

      let fullReply = ''
      let hasReceivedChunk = false
      let settled = false
      let firstChunkTimer = null
      let totalTimer = null
      let eventSource = null

      const doFallback = () => {
        if (settled) return
        settled = true
        if (eventSource) { try { eventSource.close() } catch (_) {} }
        if (firstChunkTimer) clearTimeout(firstChunkTimer)
        if (totalTimer) clearTimeout(totalTimer)
        const analysis = analyzeAttitude(fallbackText)
        setMessages(prev => prev.map(msg =>
          msg.id === replyId
            ? { ...msg, content: fallbackText, attitude: analysis.attitude, isStreaming: false }
            : msg
        ))
        setIsTyping(false)
      }

      const doSuccess = (text) => {
        if (settled) return
        settled = true
        if (firstChunkTimer) clearTimeout(firstChunkTimer)
        if (totalTimer) clearTimeout(totalTimer)
        const finalText = text && text.trim().length > 0 ? text : fallbackText
        const analysis = analyzeAttitude(finalText)
        setMessages(prev => prev.map(msg =>
          msg.id === replyId
            ? { ...msg, content: finalText, attitude: analysis.attitude, isStreaming: false }
            : msg
        ))
        setIsTyping(false)
      }

      try {
        eventSource = streamCommentary(news.id, randomPerspective.name, {
          onChunk: (chunk) => {
            if (settled) return
            hasReceivedChunk = true
            fullReply += chunk
            setMessages(prev => prev.map(msg =>
              msg.id === replyId ? { ...msg, content: fullReply } : msg
            ))
          },
          onDone: (finalContent) => {
            doSuccess(finalContent)
          },
          onError: (e) => {
            console.error('茶话会回复流式失败:', e)
            doFallback()
          }
        }, 'short')

        // 首次内容超时：10秒
        firstChunkTimer = setTimeout(() => {
          if (!hasReceivedChunk && !settled) {
            console.warn('茶话会回复首字节超时')
            doFallback()
          }
        }, 10000)

        // 总超时：40秒
        totalTimer = setTimeout(() => {
          if (!settled) {
            console.warn('茶话会回复总超时')
            doFallback()
          }
        }, 40000)

      } catch (e) {
        console.error('茶话会回复错误:', e)
        doFallback()
      }
    }, 500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatViews = (views) => {
    if (views >= 10000) return (views / 10000).toFixed(1) + '万'
    return views
  }

  return (
    <div className="tea-party-chat">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-icon">🍵</span>
          <div>
            <h3 className="chat-header-title">棱镜茶话会</h3>
            <p className="chat-header-subtitle">{perspectives?.length || 0}位角色正在讨论</p>
          </div>
        </div>
        {onClose && (
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="chat-system-message">
                <span className="system-time">{msg.time}</span>
                <div className="system-text">{msg.content}</div>
              </div>
            )
          }

          if (msg.type === 'news') {
            return (
              <div key={msg.id} className="chat-news-card">
                <div className="chat-news-header">
                  <span className="chat-news-badge">📰 新闻</span>
                  <span className="chat-news-time">{msg.time}</span>
                </div>
                <h4 className="chat-news-title">{msg.news.title}</h4>
                <p className="chat-news-summary">{msg.news.summary}</p>
                <div className="chat-news-meta">
                  <span>{msg.news.source}</span>
                  <span>·</span>
                  <span>👁 {formatViews(msg.news.views)}</span>
                </div>
              </div>
            )
          }

          if (msg.type === 'user') {
            return (
              <div key={msg.id} className="chat-message user-message">
                <div className="message-content-wrapper">
                  <div className="message-bubble user-bubble">
                    {msg.content}
                  </div>
                  <span className="message-time">{msg.time}</span>
                </div>
                <div className="message-avatar user-avatar">
                  <span>👤</span>
                </div>
              </div>
            )
          }

          if (msg.type === 'role') {
            const cfg = ATTITUDE_CONFIG[msg.attitude]
            return (
              <div key={msg.id} className={`chat-message role-message ${msg.isReply ? 'is-reply' : ''}`}>
                <div className="message-avatar">
                  {renderAvatar(msg.perspective)}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-sender">
                    <span className="sender-name" style={{ color: msg.perspective.color }}>
                      {msg.perspective.name}
                    </span>
                    {cfg && (
                      <span className="sender-attitude" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.icon}
                      </span>
                    )}
                  </div>
                  <div className="message-bubble role-bubble" style={{ borderLeftColor: msg.perspective.color }}>
                    {msg.content}
                  </div>
                  <span className="message-time">{msg.time}</span>
                </div>
              </div>
            )
          }

          return null
        })}

        {isTyping && (
          <div className="chat-message role-message typing-indicator">
            <div className="message-avatar">
              <span className="chat-emoji">💭</span>
            </div>
            <div className="message-content-wrapper">
              <div className="message-sender">
                <span className="sender-name">{isTyping}</span>
                <span className="typing-text">正在输入...</span>
              </div>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="说点什么，参与讨论吧..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            发送
          </button>
        </div>
        <p className="chat-input-hint">按 Enter 发送 · 文明讨论，理性发言</p>
      </div>
    </div>
  )
}

export default TeaPartyChat
