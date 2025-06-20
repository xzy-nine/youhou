// 评论悬浮窗样式
export const commentModalCSS = `
.comment-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.comment-modal-overlay.show {
    opacity: 1;
}

/* 右侧点击区域提示 */
.comment-modal-overlay::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100%;
    background: linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent);
    pointer-events: none;
    transition: background 0.2s ease;
}

.comment-modal-overlay:hover::after {
    background: linear-gradient(to left, rgba(0, 0, 0, 0.2), transparent);
}

.comment-modal {
    background: var(--bg-color, #ffffff);
    border-radius: 0 45px 45px 0;
    box-shadow: 2px 0 40px rgba(0, 0, 0, 0.15);
    max-width: calc(100% - 100px);
    height: calc(100vh - 40px);
    width: calc(100% - 100px);
    margin: 20px 100px 20px 0;
    position: relative;
    overflow: hidden;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.comment-modal-overlay.show .comment-modal {
    transform: translateX(0);
}

.comment-modal-header {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-color, #e1e8ed);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--header-bg, #f7f9fa);
    border-radius: 0 45px 0 0;
    min-height: 40px;
}

.comment-modal-title {
    font-size: 14px;
    font-weight: bold;
    color: var(--text-color, #14171a);
}

.comment-modal-close {
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
}

.comment-modal-close:hover {
    background-color: var(--hover-bg, #f0f0f0);
}

.comment-modal-close::before {
    content: '×';
    font-size: 20px;
    color: var(--text-color, #657786);
}

.comment-modal-content {
    padding: 0;
    height: calc(100vh - 100px);
    overflow: hidden;
    position: relative;
}

.comment-modal-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: var(--bg-color, #ffffff);
}

.comment-modal-loading {
    padding: 40px;
    text-align: center;
    color: var(--text-color, #657786);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-color, #ffffff);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
}

/* 深色模式样式 */
body.woo-theme-dark .comment-modal,
.comment-modal[data-theme="dark"] {
    --bg-color: #1d1f23;
    --border-color: #38444d;
    --header-bg: #15181c;
    --text-color: #ffffff;
    --hover-bg: #273340;
}

/* 浅色模式样式 */
body.woo-theme-light .comment-modal,
.comment-modal[data-theme="light"] {
    --bg-color: #ffffff;
    --border-color: #e1e8ed;
    --header-bg: #f7f9fa;
    --text-color: #14171a;
    --hover-bg: #f0f0f0;
}

/* 滚动条样式 */
.comment-modal-content::-webkit-scrollbar {
    width: 6px;
}

.comment-modal-content::-webkit-scrollbar-track {
    background: transparent;
}

.comment-modal-content::-webkit-scrollbar-thumb {
    background: var(--border-color, #e1e8ed);
    border-radius: 3px;
}

.comment-modal-content::-webkit-scrollbar-thumb:hover {
    background: var(--text-color, #657786);
}
`;
