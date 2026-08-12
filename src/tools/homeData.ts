// 首页展示数据 — 可自由编辑

// 社交链接（留空则不显示）
export interface SocialLink {
  name: string
  url: string
  icon: 'github' | 'email' | 'twitter' | 'blog'
}

export const profile = {
  name: 'gy13477000',
  title: '开发者 · 工具爱好者',
  // 用 GitHub 头像（自动拉取，无需上传）
  avatar: 'https://github.com/gy13477000.png',
  taglines: [
    '把繁琐的操作，变成一行点击。',
    '工具不是越多越好，而是越顺手越好。',
    '用代码缩短想法与现实的距离。',
    'Less but better, daily.'
  ],
  socials: [
    { name: 'GitHub', url: 'https://github.com/gy13477000', icon: 'github' }
  ] as SocialLink[]
}

// 工具分类标签（用于快速跳转）
export interface QuickTag {
  label: string
  match: string // 匹配 tools.ts 中 tool.tags 的子串
  color: string // CSS color
}

export const quickTags: QuickTag[] = [
  { label: '#常用', match: '常用', color: '#3b82f6' },
  { label: '#开发者', match: '开发者', color: '#8b5cf6' },
  { label: '#加密', match: '加密', color: '#ec4899' },
  { label: '#签名', match: '签名', color: '#f59e0b' },
  { label: '#安全', match: '安全', color: '#10b981' }
]

// 技术格言
export const quotes: { text: string; author?: string }[] = [
  { text: '简单是可靠的先决条件。', author: 'Edsger Dijkstra' },
  { text: '过早优化是万恶之源。', author: 'Donald Knuth' },
  { text: '代码本身是最清晰的文档。', author: '可读性大于聪明' },
  { text: '让它先工作，再让它正确，最后让它快速。', author: 'Kent Beck' },
  { text: '调试一段代码比编写它难一倍，所以如果你全力写代码，按定义你就调试不了。', author: 'Brian Kernighan' },
  { text: '今天能做的事，绝不拖到明天——因为明天的代码会更难改。' },
  { text: '任何傻瓜都能写出计算机能理解的代码，好的程序员能写出人能理解的代码。', author: 'Martin Fowler' },
  { text: 'Talk is cheap, show me the code.', author: 'Linus Torvalds' },
  { text: '没有什么比一个临时方案更持久。' },
  { text: '程序员的三大美德：懒惰、急躁、傲慢。', author: 'Larry Wall' }
]