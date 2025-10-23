# Theme Quick Reference Card

## 🎨 How to Switch Themes

### For Users:
1. Click your **profile picture** in navbar
2. Select **Settings**
3. Go to **Appearance** tab
4. Click **Dark Theme** or **Light Theme**
5. Done! Theme applies instantly

---

## 🔧 Developer Reference

### Using Theme-Aware Classes

#### ✅ DO (These automatically adapt):
```jsx
<div className="glass">Content</div>
<div className="bg-dark-lighter">Content</div>
<span className="text-light">Text</span>
<button className="btn-primary">Button</button>
<input className="input" />
```

#### ❌ DON'T (These won't adapt):
```jsx
<div style={{ background: '#1e1e1e' }}>Content</div>
<span style={{ color: '#e2e2e2' }}>Text</span>
```

---

## 📋 Common Classes Reference

### Backgrounds
| Class | Dark Theme | Light Theme |
|-------|-----------|-------------|
| `.bg-dark` | #121212 | white |
| `.bg-dark-lighter` | #1e1e1e | gray-50 |
| `.bg-dark-light` | #2d2d2d | gray-100 |
| `.bg-dark-medium` | #404040 | gray-200 |
| `.glass` | Dark translucent | Light translucent |
| `.glass-light` | Darker translucent | Lighter translucent |

### Text Colors
| Class | Dark Theme | Light Theme |
|-------|-----------|-------------|
| `.text-light` | #e2e2e2 | gray-900 |
| `.text-light-darker` | #d1d1d1 | gray-600 |
| `.text-accent` | #8c8c8c | gray-500 |

### Borders
| Class | Dark Theme | Light Theme |
|-------|-----------|-------------|
| `.border-dark-accent` | #525252 | gray-300 |

### Components
| Class | Dark Theme | Light Theme |
|-------|-----------|-------------|
| `.btn-primary` | Blue bg + light text | Blue bg + white text |
| `.btn-secondary` | Dark bg + border | White bg + border |
| `.card` | Dark bg | White bg + border |
| `.input` | Dark bg | White bg |

---

## 🎯 Adding New Light Theme Styles

### Step 1: Add to `index.css`
```css
.light-theme .your-new-class {
  background-color: white;
  color: #1f2937;
  border-color: #d1d5db;
}
```

### Step 2: Use in Component
```jsx
<div className="your-new-class">
  Content adapts to theme!
</div>
```

---

## 🐛 Troubleshooting

### Problem: Component doesn't change with theme
**Solution**: Use theme-aware classes instead of inline styles

### Problem: Text not readable in light mode
**Solution**: Use `.text-light` class (auto-adapts)

### Problem: Background stays dark in light mode
**Solution**: Use `.bg-dark` or `.glass` classes

### Problem: Theme doesn't persist
**Solution**: Already fixed! Uses localStorage

---

## 📊 Color Palette Cheat Sheet

### Dark Theme
```
Primary BG:    #121212
Surface:       #1e1e1e
Text:          #e2e2e2
Accent:        #3b82f6
Border:        #525252
```

### Light Theme
```
Primary BG:    #f9fafb
Surface:       #ffffff
Text:          #1f2937
Accent:        #2563eb
Border:        #d1d5db
```

---

## 🚀 Quick Test Checklist

- [ ] Switch to light theme in Settings
- [ ] Check all pages look good
- [ ] Verify text is readable
- [ ] Test forms and inputs
- [ ] Check buttons and links
- [ ] Refresh page (theme persists?)
- [ ] Switch back to dark theme

---

## 💡 Pro Tips

1. **Always test both themes** when adding new components
2. **Use semantic classes** (`.glass`, `.card`) not color names
3. **Check contrast** with browser DevTools
4. **Avoid inline styles** for colors
5. **Use CSS variables** for custom colors

---

## 📞 Need Help?

### Common Issues:
- **Theme not switching**: Check Settings → Appearance
- **Styles not applying**: Clear browser cache
- **Colors look wrong**: Verify using theme-aware classes

### Files to Check:
- `src/index.css` - Theme styles
- `src/store/settingsStore.ts` - Theme logic
- `src/pages/SettingsPage.tsx` - Theme toggle UI

---

**Quick Status**: ✅ Both themes fully functional!

**Last Updated**: October 13, 2025
