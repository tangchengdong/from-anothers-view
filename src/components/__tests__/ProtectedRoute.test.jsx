import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'

// mock useUserStore
vi.mock('../../store/useUserStore', () => ({
  useUserStore: vi.fn(),
}))

import { useUserStore } from '../../store/useUserStore'

function renderWithRouter(initialPath = '/profile') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Protected</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登录时跳转 /login', () => {
    useUserStore.mockReturnValue(false)
    renderWithRouter('/profile')
    expect(screen.getByTestId('login-page')).toBeTruthy()
    expect(screen.queryByTestId('protected-content')).toBeNull()
  })

  it('已登录时渲染子组件', () => {
    useUserStore.mockReturnValue(true)
    renderWithRouter('/profile')
    expect(screen.getByTestId('protected-content')).toBeTruthy()
    expect(screen.queryByTestId('login-page')).toBeNull()
  })
})
