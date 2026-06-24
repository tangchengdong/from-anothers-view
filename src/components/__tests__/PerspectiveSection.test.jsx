import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PerspectiveSection from '../PerspectiveSection'

describe('PerspectiveSection', () => {
  it('渲染 12 个视角项（6 常规 + 6 特色）', () => {
    const { container } = render(
      <PerspectiveSection
        selectedPerspective="tech"
        onPerspectiveChange={() => {}}
        onSubcategoryChange={() => {}}
        selectedSubcategory={null}
      />
    )
    const items = container.querySelectorAll('.perspective-item')
    expect(items.length).toBe(12)
  })

  it('特色视角含 ✨ 标记', () => {
    const { container } = render(
      <PerspectiveSection
        selectedPerspective="tech"
        onPerspectiveChange={() => {}}
        onSubcategoryChange={() => {}}
        selectedSubcategory={null}
      />
    )
    const featuredBadges = container.querySelectorAll('.featured-badge')
    expect(featuredBadges.length).toBe(6)
  })

  it('点击视角触发 onPerspectiveChange 回调', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <PerspectiveSection
        selectedPerspective="tech"
        onPerspectiveChange={handleChange}
        onSubcategoryChange={() => {}}
        selectedSubcategory={null}
      />
    )
    const items = container.querySelectorAll('.perspective-item')
    // 点击第一个视角（female）
    fireEvent.click(items[0])
    expect(handleChange).toHaveBeenCalledWith('female')
  })

  it('选中视角显示二级分类', () => {
    const { container } = render(
      <PerspectiveSection
        selectedPerspective="tech"
        onPerspectiveChange={() => {}}
        onSubcategoryChange={() => {}}
        selectedSubcategory={null}
      />
    )
    const subcategories = container.querySelectorAll('.subcategory-item')
    // tech 有 5 个分类 + 1 个"全部"
    expect(subcategories.length).toBe(6)
  })
})
