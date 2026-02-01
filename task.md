# 贪吃蛇游戏视觉升级任务

- [x] 编写并集成 SVG 游戏素材 [Planning]
    - [x] 设计卡通蛇头 SVG
    - [x] 设计苹果 SVG
    - [x] 设计小动物（仓鼠）SVG
- [x] 修改 `app.js` 以支持 SVG 渲染 [Execution]
    - [x] 将 SVG 字符串转换为 Canvas 可用的 Image 对象
    - [x] 修改 `generateFood` 方法支持随机食物类型（苹果/仓鼠）
    - [x] 修改 `draw` 方法，使用 SVG 渲染蛇头并处理转向
    - [x] 修改 `draw` 方法，使用 SVG 渲染多样化的食物
- [x] 增加更多动物种类 [Planning]
    - [x] 设计兔子 SVG
    - [x] 设计小鸟 SVG
- [x] 进阶视觉润色 [Execution]
    - [x] 在 `app.js` 中新增食物类型逻辑
    - [x] 为蛇身增加简单的纹理效果（如圆点花纹）
    - [x] 优化食物出现时的缩放动画
- [x] 最终验证 [Verification]
    - [x] 确认所有 4 种食物（苹果、仓鼠、兔子、小鸟）都能正确出现
    - [x] 确认蛇身纹理显示正常
- [/] 优化蛇头视觉效果 [Execution]
    - [x] 重新设计蛇头 SVG，增加吐信子、鳞片纹理、眼睛细节，使其更真实
- [x] 增加更多动物：鸡和鸭 [Execution]
    - [x] 设计小鸡 SVG (White/Red)
    - [x] 设计小鸭 SVG (Yellow/Orange)
    - [x] 并在 `app.js` 中注册和启用新动物

