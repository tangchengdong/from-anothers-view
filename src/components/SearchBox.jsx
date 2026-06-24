import React, { useState, useEffect } from 'react'
import './SearchBox.css'

function SearchBox({ onSearch, value }) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
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
            placeholder="告诉我你想了解什么？例如：想给20岁的女朋友买礼物..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <button type="submit" className="search-btn" disabled={!query.trim()}>
            探索
          </button>
        </form>
        {isFocused && (
          <div className="search-hints">
            <p className="hints-title">试试这些搜索：</p>
            <div className="hints-list">
              <button className="hint-tag" onClick={() => setQuery('想给20岁的女朋友买礼物')}>
                想给20岁的女朋友买礼物
              </button>
              <button className="hint-tag" onClick={() => setQuery('想了解现在年轻人喜欢什么')}>
                想了解现在年轻人喜欢什么
              </button>
              <button className="hint-tag" onClick={() => setQuery('想给父母买健康产品')}>
                想给父母买健康产品
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default SearchBox
