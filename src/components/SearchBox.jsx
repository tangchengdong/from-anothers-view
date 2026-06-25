import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './SearchBox.css'

function SearchBox({ onSearch, value: propValue }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (propValue !== undefined) {
      setQuery(propValue || '')
    } else {
      const urlQuery = searchParams.get('q')
      if (urlQuery) setQuery(urlQuery)
    }
  }, [propValue, searchParams])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      if (onSearch) {
        onSearch(trimmedQuery)
      } else {
        navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      }
    }
  }

  const handleHintClick = (hint) => {
    setQuery(hint)
    if (onSearch) {
      onSearch(hint)
    } else {
      navigate(`/search?q=${encodeURIComponent(hint)}`)
    }
  }

  return (
    <section className="search-section">
      <div className="search-container">
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-icon">🔍</div>
          <input
            type="text"
            className="search-input"
            placeholder="搜索新闻，例如：AI、新能源、职场..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          <button type="submit" className="search-btn" disabled={!query.trim()}>
            搜索
          </button>
        </form>
        {isFocused && (
          <div className="search-hints">
            <p className="hints-title">试试这些搜索：</p>
            <div className="hints-list">
              <button type="button" className="hint-tag" onClick={() => handleHintClick('AI')}>
                AI
              </button>
              <button type="button" className="hint-tag" onClick={() => handleHintClick('新能源汽车')}>
                新能源汽车
              </button>
              <button type="button" className="hint-tag" onClick={() => handleHintClick('职场')}>
                职场
              </button>
              <button type="button" className="hint-tag" onClick={() => handleHintClick('健康')}>
                健康
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SearchBox
