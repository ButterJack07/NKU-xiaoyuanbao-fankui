# DESIGN.md -- 测试网站

<!-- extraction-meta
source: Figma file "测试网站"
scope: current page "高保真"
date: 2026-09-06
nodes-scanned: 1351
confidence: { extracted: 100%, inferred: 0%, known: 0% }
-->

## 1. Identity

**In one line:** A design system using Inter with 20 unique colors extracted directly from Figma.

**Signature Techniques:**
- Consistent auto-layout spacing system
- Rounded shape language (12px+ radii)
- Layered shadow system for depth

## 2. Structure

High-level composition of the design, extracted from Figma pages and top-level frames. Each entry shows the frame name, type, dimensions, and auto-layout direction.

### Page: 高保真

_30 top-level frame(s)_

- **高保真｜登录页** · `FRAME` · 1440×960 · 4 children
  - **登录页装饰｜右上珊瑚** · `ELLIPSE` · 62×62
  - **登录页装饰｜右下桃杏** · `ELLIPSE` · 318×318
  - **登录页装饰｜左上暖阳** · `ELLIPSE` · 236×236
  - **登录卡片** · `FRAME` · 520×482 · vertical stack, gap 20px, padding 76/40/36/40px · 6 children
    - **页面标题** · `TEXT` · 306×40 · “校缘宝内测管理网站”
    - **辅助说明** · `TEXT` · 90×22 · “内部协作入口”
    - **登录表单** · `FRAME` · 440×172 · vertical stack, gap 16px · 2 children
      - **字段｜用户名** · `FRAME` · 440×78 · vertical stack, gap 8px · 2 children
        - _...and 2 more_
      - **字段｜密码** · `FRAME` · 440×78 · vertical stack, gap 8px · 2 children
        - _...and 2 more_
    - **按钮｜登录** · `FRAME` · 440×52 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 32×20 · “登录”
    - **登录页品牌标识** · `ELLIPSE` · 48×48
    - **品牌标识文字** · `TEXT` · 20×24 · “校”

- **高保真｜测试组首页** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 120×32 · “测试组首页”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 87×22 · “张三 · 测试组”
  - **页面标题** · `TEXT` · 120×32 · “测试组首页”
  - **业务说明** · `TEXT` · 426×22 · “测试组所有成员均可查看测试用例与 BUG；两条业务线仍相对独立。”
  - **业务卡片｜测试用例** · `FRAME` · 520×260 · vertical stack, gap 16px, padding 24px · 3 children
    - **卡片标题** · `TEXT` · 72×26 · “测试用例”
    - **卡片说明** · `TEXT` · 472×44 · “上传本地完成的测试用例文件；系统编号、收集、归档，并支持下载 / 导出。”
    - **操作按钮｜查看测试用例** · `FRAME` · 160×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “查看测试用例”
  - **业务卡片｜软件缺陷报告** · `FRAME` · 520×260 · vertical stack, gap 16px, padding 24px · 3 children
    - **卡片标题** · `TEXT` · 108×26 · “软件缺陷报告”
    - **卡片说明** · `TEXT` · 472×22 · “在线填写缺陷报告，选择归属部门后由系统自动分发到对应部门。”
    - **操作按钮｜新建缺陷报告** · `FRAME` · 160×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “新建缺陷报告”

- **高保真｜测试用例列表** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 180×32 · “测试 ＞ 测试用例”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 87×22 · “张三 · 测试组”
  - **页面标题** · `TEXT` · 96×32 · “测试用例”
  - **权限提示** · `TEXT` · 396×18 · “测试组所有成员可查看、下载测试用例；测试组长另可汇总、筛选与导出。”
  - **列表工具栏** · `FRAME` · 1120×48 · horizontal row, gap 16px · 3 children
    - **搜索框** · `FRAME` · 300×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **占位文字** · `TEXT` · 108×18 · “搜索文件名 / 上传人”
    - **按钮｜上传测试用例** · `FRAME` · 150×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “上传测试用例”
    - **按钮｜批量下载 / 导出** · `FRAME` · 150×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 90×20 · “批量下载 / 导出”
  - **测试用例列表表格** · `FRAME` · 1120×300 · 21 children
    - **表头｜编号** · `TEXT` · 26×20 · “编号”
    - **表头｜文件名** · `TEXT` · 39×20 · “文件名”
    - **表头｜上传人** · `TEXT` · 39×20 · “上传人”
    - **表头｜上传时间** · `TEXT` · 52×20 · “上传时间”
    - **表头｜文件类型** · `TEXT` · 52×20 · “文件类型”
    - **表头｜备注** · `TEXT` · 26×20 · “备注”
    - **表头｜操作** · `TEXT` · 26×20 · “操作”
    - **单元格** · `TEXT` · 50×22 · “TC-001”
    - **单元格** · `TEXT` · 142×22 · “发帖功能测试用例.xlsx”
    - **单元格** · `TEXT` · 28×22 · “张三”
    - **单元格** · `TEXT` · 123×22 · “2026-09-03 10:20”
    - **单元格** · `TEXT` · 35×22 · “Excel”
    - _...and 9 more_

- **高保真｜上传测试用例** · `FRAME` · 1440×960 · 5 children
  - **固定左侧导航** · `FRAME` · 240×960 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 228×32 · “测试 ＞ 上传测试用例”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 87×22 · “张三 · 测试组”
  - **页面标题** · `TEXT` · 144×32 · “上传测试用例”
  - **说明** · `TEXT` · 432×18 · “请上传已在本地完成的测试用例文件；网站将自动生成用例编号并记录上传信息。”
  - **上传测试用例表单** · `FRAME` · 760×440 · vertical stack, gap 20px, padding 28px · 6 children
    - **区块标题** · `TEXT` · 123×26 · “测试用例文件 *”
    - **本地文件上传区** · `FRAME` · 704×150 · vertical stack, gap 12px · 2 children
      - **上传提示** · `TEXT` · 144×18 · “选择本地文件或拖拽至此处”
      - **支持格式** · `TEXT` · 260×22 · “支持 Word、Excel 和项目允许的其他格式”
    - **字段标签** · `TEXT` · 78×20 · “备注（选填）”
    - **备注输入框** · `FRAME` · 704×84 · horizontal row, padding 12/0/0/12px · 1 children
      - **占位文字** · `TEXT` · 84×18 · “例如：发帖模块”
    - **按钮｜提交上传** · `FRAME` · 140×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 52×20 · “提交上传”
    - **系统记录提示** · `TEXT` · 704×18 · “提交后系统记录：用例编号、文件名、上传人、上传时间、文件类型、备注与当前状态。”

- **高保真｜软件缺陷报告列表** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 228×32 · “测试 ＞ 软件缺陷报告”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 87×22 · “张三 · 测试组”
  - **页面标题** · `TEXT` · 144×32 · “软件缺陷报告”
  - **说明** · `TEXT` · 381×18 · “测试组所有成员均可查看 BUG 报告及状态，并可提交本人发现的问题。”
  - **列表筛选与操作** · `FRAME` · 1120×48 · horizontal row, gap 16px · 5 children
    - **控件｜搜索问题标题** · `FRAME` · 260×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “搜索问题标题”
    - **控件｜状态筛选** · `FRAME` · 130×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 56×22 · “状态筛选”
    - **控件｜严重程度筛选** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “严重程度筛选”
    - **控件｜归属部门筛选** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “归属部门筛选”
    - **控件｜新建缺陷报告** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “新建缺陷报告”
  - **缺陷报告列表表格** · `FRAME` · 1120×320 · 27 children
    - **表头｜缺陷编号** · `TEXT` · 52×20 · “缺陷编号”
    - **表头｜问题标题** · `TEXT` · 52×20 · “问题标题”
    - **表头｜提交人** · `TEXT` · 39×20 · “提交人”
    - **表头｜当前跟进人** · `TEXT` · 65×20 · “当前跟进人”
    - **表头｜状态** · `TEXT` · 26×20 · “状态”
    - **表头｜严重程度** · `TEXT` · 52×20 · “严重程度”
    - **表头｜所属部门** · `TEXT` · 52×20 · “所属部门”
    - **表头｜最后更新时间** · `TEXT` · 78×20 · “最后更新时间”
    - **表头｜操作** · `TEXT` · 26×20 · “操作”
    - **单元格** · `TEXT` · 72×22 · “BUG-0032”
    - **单元格** · `TEXT` · 112×22 · “发帖按钮位置错误”
    - **单元格** · `TEXT` · 28×22 · “张三”
    - _...and 15 more_

- **高保真｜新建软件缺陷报告** · `FRAME` · 1440×1540 · 5 children
  - **固定左侧导航** · `FRAME` · 240×1540 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 276×32 · “测试 ＞ 新建软件缺陷报告”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 87×22 · “张三 · 测试组”
  - **页面标题** · `TEXT` · 192×32 · “新建软件缺陷报告”
  - **说明** · `TEXT` · 489×18 · “提交时必须选择技术—前端、技术—后端、设计或产品；系统将自动生成 BUG 编号并分发。”
  - **软件缺陷报告表单** · `FRAME` · 820×1180 · vertical stack, gap 16px, padding 28px · 12 children
    - **区块标题** · `TEXT` · 108×26 · “缺陷报告内容”
    - **字段｜问题标题** · `FRAME` · 764×66 · vertical stack, gap 8px · 2 children
      - **字段标签** · `TEXT` · 63×20 · “问题标题 *”
      - **输入框｜问题标题** · `FRAME` · 764×40 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **字段｜发现模块 / 功能** · `FRAME` · 764×66 · vertical stack, gap 8px · 2 children
      - **字段标签** · `TEXT` · 100×20 · “发现模块 / 功能 *”
      - **输入框｜发现模块 / 功能** · `FRAME` · 764×40 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **字段｜问题描述** · `FRAME` · 764×98 · vertical stack, gap 8px · 2 children
      - **字段标签** · `TEXT` · 63×20 · “问题描述 *”
      - **输入框｜问题描述** · `FRAME` · 764×72 · horizontal row, padding 12/0/0/12px · 1 children
        - _...and 1 more_
    - **字段｜操作步骤** · `FRAME` · 764×98 · vertical stack, gap 8px · 2 children
      - **字段标签** · `TEXT` · 63×20 · “操作步骤 *”
      - **输入框｜操作步骤** · `FRAME` · 764×72 · horizontal row, padding 12/0/0/12px · 1 children
        - _...and 1 more_
    - **字段｜预期结果** · `FRAME` · 764×82 · vertical stack, gap 8px · 2 children
      - **字段标签** · `TEXT` · 63×20 · “预期结果 *”
      - **输入框｜预期结果** · `FRAME` · 764×56 · horizontal row, padding 12/0/0/12px · 1 children
        - _...and 1 more_
    - **字段｜实际结果** · `FRAME` · 764×82 · vertical stack, gap 8px · 2 children
      - **字段标签** · `TEXT` · 63×20 · “实际结果 *”
      - **输入框｜实际结果** · `FRAME` · 764×56 · horizontal row, padding 12/0/0/12px · 1 children
        - _...and 1 more_
    - **选择项** · `FRAME` · 764×86 · horizontal row, gap 16px · 2 children
      - **字段｜严重程度** · `FRAME` · 278×86 · vertical stack, gap 8px · 2 children
        - _...and 2 more_
      - **字段｜归属部门** · `FRAME` · 470×86 · vertical stack, gap 8px · 2 children
        - _...and 2 more_
    - **字段标签** · `TEXT` · 37×20 · “附件 *”
    - **附件上传** · `FRAME` · 764×48 · horizontal row, padding 0/0/0/12px · 1 children
      - **附件说明** · `TEXT` · 120×18 · “上传截图、录屏或文件”
    - **按钮｜提交缺陷报告** · `FRAME` · 160×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “提交缺陷报告”
    - **系统提示** · `TEXT` · 390×54 · “提交后系统生成 BUG 编号并自动分发。 / 部门说明：前端—页面交互；后端—数据服务；设计—视觉资源；产品—需求流程。”

- **高保真｜缺陷详情** · `FRAME` · 1440×1320 · 7 children
  - **固定左侧导航** · `FRAME` · 240×1320 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 360×32 · “测试 ＞ 软件缺陷报告 ＞ 缺陷详情”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 87×22 · “张三 · 测试组”
  - **页面标题** · `TEXT` · 342×32 · “BUG-0032｜发帖按钮位置错误”
  - **缺陷元信息** · `TEXT` · 370×18 · “提交人：张三　提交时间：2026-09-03 14:20　当前所属部门：设计”
  - **完整报告内容** · `FRAME` · 720×502 · vertical stack, gap 14px, padding 28px · 8 children
    - **区块标题** · `TEXT` · 108×26 · “完整报告内容”
    - **详情字段｜发现模块 / 功能** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 90×20 · “发现模块 / 功能”
      - **字段内容** · `TEXT` · 664×22 · “发帖”
    - **详情字段｜问题描述** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “问题描述”
      - **字段内容** · `TEXT` · 664×22 · “发帖页面的发布按钮位置与设计稿不一致。”
    - **详情字段｜操作步骤** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “操作步骤”
      - **字段内容** · `TEXT` · 664×22 · “进入发帖页面 → 观察底部操作区域。”
    - **详情字段｜预期结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “预期结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮应与页面规范一致。”
    - **详情字段｜实际结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “实际结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮偏离预期位置。”
    - **详情字段｜严重程度** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “严重程度”
      - **字段内容** · `TEXT` · 664×22 · “一般”
    - **详情字段｜附件** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 26×20 · “附件”
      - **字段内容** · `TEXT` · 664×22 · “截图 1 张｜可下载”
  - **跟进与处理** · `FRAME` · 360×364 · 7 children
    - **区块标题** · `TEXT` · 90×26 · “跟进与处理”
    - **信息** · `TEXT` · 310×18 · “跟进人：李四｜微信 li_si｜电话 138****0004”
    - **信息** · `TEXT` · 112×22 · “当前状态：处理中”
    - **信息** · `TEXT` · 154×22 · “处理备注：等待设计调整”
    - **信息** · `TEXT` · 310×44 · “测试普通成员可查看；指定跟进人和转组仅测试组长、超级管理员可操作。”
    - **操作按钮｜填写处理备注** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “填写处理备注”
    - **操作按钮｜更改当前状态（仅跟进人）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 182×20 · “更改当前状态（仅李四可操作）”
  - **历史记录** · `FRAME` · 1120×220 · vertical stack, gap 12px, padding 24px · 3 children
    - **区块标题** · `TEXT` · 162×26 · “转组历史与操作历史”
    - **转组历史** · `TEXT` · 480×18 · “当前无转组记录。发生转组时必须记录原部门、目标部门、转组人、转组时间与转组原因。”
    - **操作历史** · `TEXT` · 426×18 · “2026-09-03 14:20　张三提交缺陷报告；系统生成 BUG-0032 并分发至设计。”

- **高保真｜前端缺陷列表** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 120×32 · “技术—前端”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 117×22 · “李四 · 技术—前端”
  - **页面标题** · `TEXT` · 216×32 · “技术—前端缺陷列表”
  - **说明** · `TEXT` · 636×18 · “仅显示当前归属为技术—前端的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
  - **列表筛选与操作** · `FRAME` · 1120×48 · horizontal row, gap 16px · 4 children
    - **控件｜搜索问题标题** · `FRAME` · 260×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “搜索问题标题”
    - **控件｜状态筛选** · `FRAME` · 130×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 56×22 · “状态筛选”
    - **控件｜严重程度筛选** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “严重程度筛选”
    - **控件｜新建缺陷报告** · `FRAME` · 150×40 · horizontal row · 1 children
      - **控件文字** · `TEXT` · 64×22 · “导出报告”
  - **本部门缺陷列表（不显示所属部门）** · `FRAME` · 1120×320 · 27 children
    - **表头｜缺陷编号** · `TEXT` · 52×20 · “缺陷编号”
    - **表头｜问题标题** · `TEXT` · 52×20 · “问题标题”
    - **表头｜提交人** · `TEXT` · 39×20 · “提交人”
    - **表头｜提交人联系方式** · `TEXT` · 52×20 · “联系方式”
    - **表头｜当前跟进人** · `TEXT` · 65×20 · “当前跟进人”
    - **表头｜状态** · `TEXT` · 26×20 · “状态”
    - **表头｜严重程度** · `TEXT` · 52×20 · “严重程度”
    - **表头｜最后更新时间** · `TEXT` · 78×20 · “最后更新时间”
    - **表头｜操作** · `TEXT` · 26×20 · “操作”
    - **单元格** · `TEXT` · 72×22 · “BUG-0032”
    - **单元格** · `TEXT` · 112×22 · “发帖按钮位置错误”
    - **单元格** · `TEXT` · 28×22 · “张三”
    - _...and 15 more_

- **高保真｜后端缺陷列表** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 120×32 · “技术—后端”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 117×22 · “李四 · 技术—后端”
  - **页面标题** · `TEXT` · 216×32 · “技术—后端缺陷列表”
  - **说明** · `TEXT` · 636×18 · “仅显示当前归属为技术—后端的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
  - **列表筛选与操作** · `FRAME` · 1120×48 · horizontal row, gap 16px · 4 children
    - **控件｜搜索问题标题** · `FRAME` · 260×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “搜索问题标题”
    - **控件｜状态筛选** · `FRAME` · 130×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 56×22 · “状态筛选”
    - **控件｜严重程度筛选** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “严重程度筛选”
    - **控件｜新建缺陷报告** · `FRAME` · 150×40 · horizontal row · 1 children
      - **控件文字** · `TEXT` · 64×22 · “导出报告”
  - **本部门缺陷列表（不显示所属部门）** · `FRAME` · 1120×320 · 27 children
    - **表头｜缺陷编号** · `TEXT` · 52×20 · “缺陷编号”
    - **表头｜问题标题** · `TEXT` · 52×20 · “问题标题”
    - **表头｜提交人** · `TEXT` · 39×20 · “提交人”
    - **表头｜提交人联系方式** · `TEXT` · 52×20 · “联系方式”
    - **表头｜当前跟进人** · `TEXT` · 65×20 · “当前跟进人”
    - **表头｜状态** · `TEXT` · 26×20 · “状态”
    - **表头｜严重程度** · `TEXT` · 52×20 · “严重程度”
    - **表头｜最后更新时间** · `TEXT` · 78×20 · “最后更新时间”
    - **表头｜操作** · `TEXT` · 26×20 · “操作”
    - **单元格** · `TEXT` · 72×22 · “BUG-0032”
    - **单元格** · `TEXT` · 112×22 · “发帖按钮位置错误”
    - **单元格** · `TEXT` · 28×22 · “张三”
    - _...and 15 more_

- **高保真｜设计缺陷列表** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 48×32 · “设计”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 72×22 · “李四 · 设计”
  - **页面标题** · `TEXT` · 144×32 · “设计缺陷列表”
  - **说明** · `TEXT` · 600×18 · “仅显示当前归属为设计的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
  - **列表筛选与操作** · `FRAME` · 1120×48 · horizontal row, gap 16px · 4 children
    - **控件｜搜索问题标题** · `FRAME` · 260×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “搜索问题标题”
    - **控件｜状态筛选** · `FRAME` · 130×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 56×22 · “状态筛选”
    - **控件｜严重程度筛选** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “严重程度筛选”
    - **控件｜新建缺陷报告** · `FRAME` · 150×40 · horizontal row · 1 children
      - **控件文字** · `TEXT` · 64×22 · “导出报告”
  - **本部门缺陷列表（不显示所属部门）** · `FRAME` · 1120×320 · 27 children
    - **表头｜缺陷编号** · `TEXT` · 52×20 · “缺陷编号”
    - **表头｜问题标题** · `TEXT` · 52×20 · “问题标题”
    - **表头｜提交人** · `TEXT` · 39×20 · “提交人”
    - **表头｜提交人联系方式** · `TEXT` · 52×20 · “联系方式”
    - **表头｜当前跟进人** · `TEXT` · 65×20 · “当前跟进人”
    - **表头｜状态** · `TEXT` · 26×20 · “状态”
    - **表头｜严重程度** · `TEXT` · 52×20 · “严重程度”
    - **表头｜最后更新时间** · `TEXT` · 78×20 · “最后更新时间”
    - **表头｜操作** · `TEXT` · 26×20 · “操作”
    - **单元格** · `TEXT` · 72×22 · “BUG-0032”
    - **单元格** · `TEXT` · 112×22 · “发帖按钮位置错误”
    - **单元格** · `TEXT` · 28×22 · “张三”
    - _...and 15 more_

- **高保真｜产品缺陷列表** · `FRAME` · 1440×960 · 6 children
  - **固定左侧导航** · `FRAME` · 240×960 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 48×32 · “产品”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 72×22 · “李四 · 产品”
  - **页面标题** · `TEXT` · 144×32 · “产品缺陷列表”
  - **说明** · `TEXT` · 600×18 · “仅显示当前归属为产品的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
  - **列表筛选与操作** · `FRAME` · 1120×48 · horizontal row, gap 16px · 4 children
    - **控件｜搜索问题标题** · `FRAME` · 260×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “搜索问题标题”
    - **控件｜状态筛选** · `FRAME` · 130×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 56×22 · “状态筛选”
    - **控件｜严重程度筛选** · `FRAME` · 150×40 · horizontal row, padding 0/0/0/12px · 1 children
      - **控件文字** · `TEXT` · 84×22 · “严重程度筛选”
    - **控件｜新建缺陷报告** · `FRAME` · 150×40 · horizontal row · 1 children
      - **控件文字** · `TEXT` · 64×22 · “导出报告”
  - **本部门缺陷列表（不显示所属部门）** · `FRAME` · 1120×320 · 27 children
    - **表头｜缺陷编号** · `TEXT` · 52×20 · “缺陷编号”
    - **表头｜问题标题** · `TEXT` · 52×20 · “问题标题”
    - **表头｜提交人** · `TEXT` · 39×20 · “提交人”
    - **表头｜提交人联系方式** · `TEXT` · 52×20 · “联系方式”
    - **表头｜当前跟进人** · `TEXT` · 65×20 · “当前跟进人”
    - **表头｜状态** · `TEXT` · 26×20 · “状态”
    - **表头｜严重程度** · `TEXT` · 52×20 · “严重程度”
    - **表头｜最后更新时间** · `TEXT` · 78×20 · “最后更新时间”
    - **表头｜操作** · `TEXT` · 26×20 · “操作”
    - **单元格** · `TEXT` · 72×22 · “BUG-0032”
    - **单元格** · `TEXT` · 112×22 · “发帖按钮位置错误”
    - **单元格** · `TEXT` · 28×22 · “张三”
    - _...and 15 more_

- **高保真｜前端缺陷详情** · `FRAME` · 1440×1320 · 7 children
  - **固定左侧导航** · `FRAME` · 240×1320 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 432×32 · “技术—前端 ＞ 软件缺陷报告 ＞ 缺陷详情”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 117×18 · “李四 · 技术—前端”
  - **页面标题** · `TEXT` · 342×32 · “BUG-0032｜发帖按钮位置错误”
  - **缺陷元信息** · `TEXT` · 406×18 · “提交人：张三　提交时间：2026-09-03 14:20　当前所属部门：技术—前端”
  - **完整报告内容** · `FRAME` · 720×502 · vertical stack, gap 14px, padding 28px · 8 children
    - **区块标题** · `TEXT` · 108×26 · “完整报告内容”
    - **详情字段｜发现模块 / 功能** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 90×20 · “发现模块 / 功能”
      - **字段内容** · `TEXT` · 664×22 · “发帖”
    - **详情字段｜问题描述** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “问题描述”
      - **字段内容** · `TEXT` · 664×22 · “发帖页面的发布按钮位置与设计稿不一致。”
    - **详情字段｜操作步骤** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “操作步骤”
      - **字段内容** · `TEXT` · 664×22 · “进入发帖页面 → 观察底部操作区域。”
    - **详情字段｜预期结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “预期结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮应与页面规范一致。”
    - **详情字段｜实际结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “实际结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮偏离预期位置。”
    - **详情字段｜严重程度** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “严重程度”
      - **字段内容** · `TEXT` · 664×22 · “一般”
    - **详情字段｜附件** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 26×20 · “附件”
      - **字段内容** · `TEXT` · 664×22 · “截图 1 张｜可下载”
  - **跟进与处理** · `FRAME` · 360×418 · vertical stack, gap 14px, padding 24px · 9 children
    - **区块标题** · `TEXT` · 90×26 · “跟进与处理”
    - **信息** · `TEXT` · 310×18 · “跟进人：李四｜微信 li_si｜电话 138****0004”
    - **信息** · `TEXT` · 96×18 · “当前状态：处理中”
    - **信息** · `TEXT` · 132×18 · “处理备注：等待设计调整”
    - **信息** · `TEXT` · 310×36 · “本部门成员可指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
    - **操作按钮｜填写处理备注** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “填写处理备注”
    - **操作按钮｜指定 / 修改跟进人（组长）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 194×20 · “指定 / 修改跟进人（本部门成员）”
    - **操作按钮｜转组（普通成员禁用）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 207×20 · “转组（仅本部门组长 / 超级管理员）”
    - **操作按钮｜更改当前状态（仅跟进人）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “更改当前状态”
  - **历史记录** · `FRAME` · 1120×220 · vertical stack, gap 12px, padding 24px · 3 children
    - **区块标题** · `TEXT` · 162×26 · “转组历史与操作历史”
    - **转组历史** · `TEXT` · 480×18 · “当前无转组记录。发生转组时必须记录原部门、目标部门、转组人、转组时间与转组原因。”
    - **操作历史** · `TEXT` · 426×18 · “2026-09-03 14:20　张三提交缺陷报告；系统生成 BUG-0032 并分发至设计。”

- **高保真｜后端缺陷详情** · `FRAME` · 1440×1320 · 7 children
  - **固定左侧导航** · `FRAME` · 240×1320 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 432×32 · “技术—后端 ＞ 软件缺陷报告 ＞ 缺陷详情”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 117×18 · “李四 · 技术—后端”
  - **页面标题** · `TEXT` · 342×32 · “BUG-0036｜消息列表加载失败”
  - **缺陷元信息** · `TEXT` · 406×18 · “提交人：张三　提交时间：2026-09-03 14:20　当前所属部门：技术—后端”
  - **完整报告内容** · `FRAME` · 720×502 · vertical stack, gap 14px, padding 28px · 8 children
    - **区块标题** · `TEXT` · 108×26 · “完整报告内容”
    - **详情字段｜发现模块 / 功能** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 90×20 · “发现模块 / 功能”
      - **字段内容** · `TEXT` · 664×22 · “发帖”
    - **详情字段｜问题描述** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “问题描述”
      - **字段内容** · `TEXT` · 664×22 · “发帖页面的发布按钮位置与设计稿不一致。”
    - **详情字段｜操作步骤** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “操作步骤”
      - **字段内容** · `TEXT` · 664×22 · “进入发帖页面 → 观察底部操作区域。”
    - **详情字段｜预期结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “预期结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮应与页面规范一致。”
    - **详情字段｜实际结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “实际结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮偏离预期位置。”
    - **详情字段｜严重程度** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “严重程度”
      - **字段内容** · `TEXT` · 664×22 · “一般”
    - **详情字段｜附件** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 26×20 · “附件”
      - **字段内容** · `TEXT` · 664×22 · “截图 1 张｜可下载”
  - **跟进与处理** · `FRAME` · 360×418 · vertical stack, gap 14px, padding 24px · 9 children
    - **区块标题** · `TEXT` · 90×26 · “跟进与处理”
    - **信息** · `TEXT` · 310×18 · “跟进人：李四｜微信 li_si｜电话 138****0004”
    - **信息** · `TEXT` · 96×18 · “当前状态：处理中”
    - **信息** · `TEXT` · 132×18 · “处理备注：等待设计调整”
    - **信息** · `TEXT` · 310×36 · “本部门成员可指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
    - **操作按钮｜填写处理备注** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “填写处理备注”
    - **操作按钮｜指定 / 修改跟进人（组长）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 194×20 · “指定 / 修改跟进人（本部门成员）”
    - **操作按钮｜转组（普通成员禁用）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 207×20 · “转组（仅本部门组长 / 超级管理员）”
    - **操作按钮｜更改当前状态（仅跟进人）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “更改当前状态”
  - **历史记录** · `FRAME` · 1120×220 · vertical stack, gap 12px, padding 24px · 3 children
    - **区块标题** · `TEXT` · 162×26 · “转组历史与操作历史”
    - **转组历史** · `TEXT` · 480×18 · “当前无转组记录。发生转组时必须记录原部门、目标部门、转组人、转组时间与转组原因。”
    - **操作历史** · `TEXT` · 426×18 · “2026-09-03 14:20　张三提交缺陷报告；系统生成 BUG-0032 并分发至设计。”

- **高保真｜设计缺陷详情** · `FRAME` · 1440×1320 · 7 children
  - **固定左侧导航** · `FRAME` · 240×1320 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 360×32 · “设计 ＞ 软件缺陷报告 ＞ 缺陷详情”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 72×18 · “李四 · 设计”
  - **页面标题** · `TEXT` · 342×32 · “BUG-0032｜发帖按钮位置错误”
  - **缺陷元信息** · `TEXT` · 370×18 · “提交人：张三　提交时间：2026-09-03 14:20　当前所属部门：设计”
  - **完整报告内容** · `FRAME` · 720×502 · vertical stack, gap 14px, padding 28px · 8 children
    - **区块标题** · `TEXT` · 108×26 · “完整报告内容”
    - **详情字段｜发现模块 / 功能** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 90×20 · “发现模块 / 功能”
      - **字段内容** · `TEXT` · 664×22 · “发帖”
    - **详情字段｜问题描述** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “问题描述”
      - **字段内容** · `TEXT` · 664×22 · “发帖页面的发布按钮位置与设计稿不一致。”
    - **详情字段｜操作步骤** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “操作步骤”
      - **字段内容** · `TEXT` · 664×22 · “进入发帖页面 → 观察底部操作区域。”
    - **详情字段｜预期结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “预期结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮应与页面规范一致。”
    - **详情字段｜实际结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “实际结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮偏离预期位置。”
    - **详情字段｜严重程度** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “严重程度”
      - **字段内容** · `TEXT` · 664×22 · “一般”
    - **详情字段｜附件** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 26×20 · “附件”
      - **字段内容** · `TEXT` · 664×22 · “截图 1 张｜可下载”
  - **跟进与处理** · `FRAME` · 360×418 · vertical stack, gap 14px, padding 24px · 9 children
    - **区块标题** · `TEXT` · 90×26 · “跟进与处理”
    - **信息** · `TEXT` · 310×18 · “跟进人：李四｜微信 li_si｜电话 138****0004”
    - **信息** · `TEXT` · 96×18 · “当前状态：处理中”
    - **信息** · `TEXT` · 132×18 · “处理备注：等待设计调整”
    - **信息** · `TEXT` · 310×36 · “本部门成员可指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
    - **操作按钮｜填写处理备注** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “填写处理备注”
    - **操作按钮｜指定 / 修改跟进人（组长）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 194×20 · “指定 / 修改跟进人（本部门成员）”
    - **操作按钮｜转组（普通成员禁用）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 207×20 · “转组（仅本部门组长 / 超级管理员）”
    - **操作按钮｜更改当前状态（仅跟进人）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “更改当前状态”
  - **历史记录** · `FRAME` · 1120×220 · vertical stack, gap 12px, padding 24px · 3 children
    - **区块标题** · `TEXT` · 162×26 · “转组历史与操作历史”
    - **转组历史** · `TEXT` · 480×18 · “当前无转组记录。发生转组时必须记录原部门、目标部门、转组人、转组时间与转组原因。”
    - **操作历史** · `TEXT` · 426×18 · “2026-09-03 14:20　张三提交缺陷报告；系统生成 BUG-0032 并分发至设计。”

- **高保真｜产品缺陷详情** · `FRAME` · 1440×1320 · 7 children
  - **固定左侧导航** · `FRAME` · 240×1320 · vertical stack, gap 32px, padding 50/20/0/20px · 3 children
    - **产品名称** · `TEXT` · 198×26 · “校缘宝内测管理网站”
    - **部门导航** · `FRAME` · 200×260 · vertical stack · 5 children
      - **导航项｜测试** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—前端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜技术—后端** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜设计** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
      - **导航项｜产品** · `FRAME` · 200×44 · horizontal row, padding 0/0/0/12px · 1 children
        - _...and 1 more_
    - **导航项｜公告消息** · `FRAME` · 160×36 · horizontal row, padding 0/0/0/12px · 1 children
      - **导航文字** · `TEXT` · 72×22 · “公告信息”
  - **顶部用户区** · `FRAME` · 1200×64 · horizontal row, padding 0/32/0/32px · 2 children
    - **当前位置** · `TEXT` · 360×32 · “产品 ＞ 软件缺陷报告 ＞ 缺陷详情”
    - **个人信息卡** · `FRAME` · 190×44 · horizontal row, gap 8px, padding 8/12/8/10px · 2 children
      - **虚拟头像** · `FRAME` · 28×28 · horizontal row · 1 children
        - _...and 1 more_
      - **用户信息** · `TEXT` · 72×18 · “李四 · 产品”
  - **页面标题** · `TEXT` · 366×32 · “BUG-0038｜发布规则描述不清晰”
  - **缺陷元信息** · `TEXT` · 370×18 · “提交人：张三　提交时间：2026-09-03 14:20　当前所属部门：产品”
  - **完整报告内容** · `FRAME` · 720×502 · vertical stack, gap 14px, padding 28px · 8 children
    - **区块标题** · `TEXT` · 108×26 · “完整报告内容”
    - **详情字段｜发现模块 / 功能** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 90×20 · “发现模块 / 功能”
      - **字段内容** · `TEXT` · 664×22 · “发帖”
    - **详情字段｜问题描述** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “问题描述”
      - **字段内容** · `TEXT` · 664×22 · “发帖页面的发布按钮位置与设计稿不一致。”
    - **详情字段｜操作步骤** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “操作步骤”
      - **字段内容** · `TEXT` · 664×22 · “进入发帖页面 → 观察底部操作区域。”
    - **详情字段｜预期结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “预期结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮应与页面规范一致。”
    - **详情字段｜实际结果** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “实际结果”
      - **字段内容** · `TEXT` · 664×22 · “发布按钮偏离预期位置。”
    - **详情字段｜严重程度** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 52×20 · “严重程度”
      - **字段内容** · `TEXT` · 664×22 · “一般”
    - **详情字段｜附件** · `FRAME` · 664×46 · vertical stack, gap 4px · 2 children
      - **字段标签** · `TEXT` · 26×20 · “附件”
      - **字段内容** · `TEXT` · 664×22 · “截图 1 张｜可下载”
  - **跟进与处理** · `FRAME` · 360×418 · vertical stack, gap 14px, padding 24px · 9 children
    - **区块标题** · `TEXT` · 90×26 · “跟进与处理”
    - **信息** · `TEXT` · 310×18 · “跟进人：李四｜微信 li_si｜电话 138****0004”
    - **信息** · `TEXT` · 96×18 · “当前状态：处理中”
    - **信息** · `TEXT` · 132×18 · “处理备注：等待设计调整”
    - **信息** · `TEXT` · 310×36 · “本部门成员可指定跟进人与处理；转组仅本部门组长、超级管理员可操作。”
    - **操作按钮｜填写处理备注** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “填写处理备注”
    - **操作按钮｜指定 / 修改跟进人（组长）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 194×20 · “指定 / 修改跟进人（本部门成员）”
    - **操作按钮｜转组（普通成员禁用）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 207×20 · “转组（仅本部门组长 / 超级管理员）”
    - **操作按钮｜更改当前状态（仅跟进人）** · `FRAME` · 310×40 · horizontal row · 1 children
      - **按钮文字** · `TEXT` · 78×20 · “更改当前状态”
  - **历史记录** · `FRAME` · 1120×220 · vertical stack, gap 12px, padding 24px · 3 children
    - **区块标题** · `TEXT` · 162×26 · “转组历史与操作历史”
    - **转组历史** · `TEXT` · 480×18 · “当前无转组记录。发生转组时必须记录原部门、目标部门、转组人、转组时间与转组原因。”
    - **操作历史** · `TEXT` · 426×18 · “2026-09-03 14:20　张三提交缺陷报告；系统生成 BUG-0032 并分发至设计。”

_...and 15 more frame(s) on this page_

## 3. Color

### Palette
| Token | Value | Role | Usage | Similar | Source |
|-------|-------|------|-------|---------|--------|
| `accent` | `#0f172a` | accent | 490× | `#0e1b2f` | node |
| `background` | `#ffffff` | background | 427× | — | node |
| `text-primary` | `#000000` | text-primary | 180× | — | node |
| `accent-alt` | `#5c3618` | accent | 88× | — | node |
| `text-tertiary` | `#64748b` | text-tertiary | 87× | — | node |
| `accent-3` | `#ff5053` | accent | 70× | — | node |
| `surface` | `#fff4d8` | surface | 35× | `#fff5df` | node |
| `text-primary-alt` | `#141c1f` | text-primary | 17× | — | node |
| `border` | `#a3a3a3` | border | 17× | — | node |
| `background-alt` | `#fff8e8` | background | 11× | — | node |
| `accent-4` | `#e8e0d9` | accent | 6× | `#ebe4de` | node |
| `text-tertiary-alt` | `#6e635c` | text-tertiary | 5× | — | node |
| `accent-5` | `#4f6685` | accent | 3× | — | node |
| `text-tertiary-3` | `#7d746c` | text-tertiary | 2× | — | node |
| `accent-6` | `#ff8587` | accent | 1× | — | node |
| `accent-7` | `#ffcf7b` | accent | 1× | — | node |
| `surface-alt` | `#ffe4d8` | surface | 1× | — | node |

_The **Similar** column lists hexes that were visually indistinguishable (Δ < 12) and collapsed into the canonical token. Use the canonical token in code; treat the similar values as the same intent._

## 4. Typography

### Fonts
- **Inter**

### Scale
| Role | Token | Size | Weight | Line Height | Letter Spacing | Source |
|------|-------|------|--------|-------------|----------------|--------|
| 高保真／展示标题 | `type` | 32px | 700 | 40px | normal | style |
| 页面标题 | `type-2` | 28px | 600 | 36px | normal | style |
| 高保真／页面标题 | `type-3` | 24px | 600 | 32px | normal | style |
| 高保真／区块标题 | `type-4` | 18px | 600 | 26px | normal | style |
| 高保真／正文 | `type-5` | 14px | 400 | 22px | normal | style |
| 高保真／标签 | `type-6` | 13px | 500 | 20px | normal | style |
| 高保真／辅助文字 | `type-7` | 12px | 400 | 18px | normal | style |
| Display | `display` | 34px | 700 | 40px | normal | node |
| H1 | `h1` | 28px | 700 | 36px | normal | node |
| H2 | `h2` | 22px | 600 | 26px | normal | node |
| H3 | `h3` | 20px | 700 | auto | normal | node |
| Body lg | `body-lg` | 18px | 400 | 22px | normal | node |
| Body | `body` | 16px | 400 | auto | normal | node |
| Body | `body-2` | 15px | 400 | 22px | normal | node |
| Body (600) | `body-semibold` | 16px | 600 | 20px | normal | node |
| Body (600) | `body-semibold-2` | 15px | 600 | 22px | normal | node |
| Body sm | `body-sm` | 13px | 400 | auto | normal | node |
| Body sm (500) | `body-sm-medium` | 14px | 500 | 22px | normal | node |
| Body sm (600) | `body-sm-semibold` | 14px | 600 | auto | normal | node |
| Body sm (600) | `body-sm-semibold-2` | 13px | 600 | auto | normal | node |
| Caption (600) | `caption-semibold` | 12px | 600 | auto | normal | node |

## 5. Spacing & Layout

### Base Unit
Values found: 4, 5, 6, 8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 50, 76

### Border Radius
| Token | Value | Usage Count |
|-------|-------|-------------|
| `radius-sm-2` | 4px | 4 |
| `radius-sm` | 6px | 9 |
| `radius-md` | 8px | 203 |
| `radius-lg-5` | 10px | 24 |
| `radius-lg-4` | 12px | 41 |
| `radius-lg-3` | 14px | 18 |
| `radius-lg-2` | 16px | 38 |
| `radius-lg` | 24px | 7 |

## 6. Depth & Motion

### Elevation
| Token | Shadow | Source |
|-------|--------|--------|
| `高保真／阴影／卡片` | `0px 4px 12px 0px rgba(15, 23, 41, 0.08)` | style |
| `高保真／阴影／弹窗` | `0px 16px 32px 0px rgba(15, 23, 41, 0.16)` | style |

## 7. Components

No named components detected.

## 8. States

State tokens should be derived from the base palette above. Recommended mappings:

| State | Treatment |
|-------|-----------|
| Hover | Lighten/darken accent by 10% |
| Focus | 2px ring using accent color with 30% opacity |
| Disabled | 40% opacity, no pointer events |
| Error | Use danger color for border and text |

## 9. Rules

### Do
- Use `#ffffff` (`background`) as the page background
- Use `#000000` (`text-primary`) for primary text
- Use `#0f172a` (`accent`) as the primary accent color
- Keep border-radius consistent: 4px, 6px, 8px, 10px, 12px, 14px, 16px, 24px
- Use the spacing scale above for all padding and margins
- Maintain the type scale hierarchy for visual rhythm

### Don't
- Don't use colors outside the extracted palette
- Don't mix font families arbitrarily
- Don't use arbitrary spacing values outside the scale
- Don't flatten the shadow system to single-layer shadows

## 10. Extending this system

This file captures the visual language of one screen (or a small set). Most products grow from a landing page into a full app — auth, dashboard, settings, marketing pages, emails. Reuse this document as the canonical reference so new screens stay coherent.

### How to reuse this DESIGN.md
1. **Treat it as the source of truth.** Commit it at the repo root. Any new page or component should be built from the tokens above, not re-invented.
2. **Feed it to your AI coding tool.** Paste this file (or include it via `@DESIGN.md`) when prompting Copilot / Cursor / Claude to generate new pages. The model will reuse the exact tokens instead of inventing new ones.
3. **Re-run this plugin** whenever the Figma file changes substantially and diff the output. The diff itself is your design-system changelog.
4. **Promote tokens to code.** Mirror the palette, type scale, spacing, and radii into CSS variables, a Tailwind config, or a tokens file. Reference them by name in components — never hardcode hex/px values.

### Adding a new screen
- Start from the **Identity** statement above — the new screen must read as the same product.
- Pick layouts from existing **Structure** patterns (same containers, same gaps, same padding rhythm) before introducing new ones.
- Use only the existing spacing scale (4px, 5px, 6px, 8px, 10px, 11px, 12px, 14px, 16px, 18px, 20px, 22px, 24px, 28px, 32px, 36px, 40px, 50px, 76px). If you need a new value, add it here first so the next person knows it's allowed.
- Reuse the same **States** treatments (hover, focus, disabled, error). Consistency across screens is what makes states feel intentional.

### When to add a new token vs reuse
| Situation | Action |
|-----------|--------|
| Need a color that's a tint/shade of an existing one | Reuse + adjust opacity, don't add a new hex |
| Need a font size between two existing steps | Pick the closer existing step; resist filling the gap |
| Need a one-off spacing value | Round to the nearest scale value first |
| Need a genuinely new semantic role (e.g. `info`, `brand-2`) | Add it here with a clear role + confidence note |
| Need a new component pattern used 3+ times | Promote to the Components section |

### Page types likely to come next
If this design is a landing page, here are common follow-on surfaces and what to inherit:

| Surface | Inherit | Likely new tokens |
|---------|---------|-------------------|
| Auth (sign in / sign up) | Inputs, buttons, type scale, background | Form validation states, link color |
| Dashboard / app shell | Spacing, radii, shadows, nav patterns | Sidebar widths, data-density type step, table row heights |
| Settings | Inputs, buttons, type scale | Section dividers, toggle component, danger-zone treatment |
| Marketing / content pages | Identity, type scale, hero patterns | Long-form body width, blockquote, code block (if relevant) |
| Empty / error / 404 states | Type scale, illustration tone, CTA pattern | Illustration sizing tokens |
| Transactional emails | Color palette (with email-safe fallbacks), type scale | Email-safe font stack, fixed widths (600px) |

### Versioning
- Bump a header (`<!-- version: X.Y -->`) when the palette, type scale, or spacing scale changes — those are breaking.
- Non-breaking additions (a new component, a new shadow level) are minor.
- Keep this file in the same PR as the code change that introduces or consumes the new token, so design and code never drift.

## 11. Machine-readable tokens

The block below is the canonical token map. Reference this when generating code or syncing to CSS variables / Tailwind config. It mirrors the tables above but is unambiguous and parseable.

```json design-tokens
{
  "$schema": "design-tokens.v1",
  "meta": {
    "source": "测试网站",
    "generated": "2026-09-06"
  },
  "color": {
    "accent": "#0f172a",
    "background": "#ffffff",
    "text-primary": "#000000",
    "accent-alt": "#5c3618",
    "text-tertiary": "#64748b",
    "accent-3": "#ff5053",
    "surface": "#fff4d8",
    "text-primary-alt": "#141c1f",
    "border": "#a3a3a3",
    "background-alt": "#fff8e8",
    "accent-4": "#e8e0d9",
    "text-tertiary-alt": "#6e635c",
    "accent-5": "#4f6685",
    "text-tertiary-3": "#7d746c",
    "accent-6": "#ff8587",
    "accent-7": "#ffcf7b",
    "surface-alt": "#ffe4d8"
  },
  "typography": {
    "type": {
      "fontFamily": "Inter",
      "fontSize": 32,
      "fontWeight": 700,
      "lineHeight": "40px",
      "letterSpacing": "normal"
    },
    "type-2": {
      "fontFamily": "Inter",
      "fontSize": 28,
      "fontWeight": 600,
      "lineHeight": "36px",
      "letterSpacing": "normal"
    },
    "type-3": {
      "fontFamily": "Inter",
      "fontSize": 24,
      "fontWeight": 600,
      "lineHeight": "32px",
      "letterSpacing": "normal"
    },
    "type-4": {
      "fontFamily": "Inter",
      "fontSize": 18,
      "fontWeight": 600,
      "lineHeight": "26px",
      "letterSpacing": "normal"
    },
    "type-5": {
      "fontFamily": "Inter",
      "fontSize": 14,
      "fontWeight": 400,
      "lineHeight": "22px",
      "letterSpacing": "normal"
    },
    "type-6": {
      "fontFamily": "Inter",
      "fontSize": 13,
      "fontWeight": 500,
      "lineHeight": "20px",
      "letterSpacing": "normal"
    },
    "type-7": {
      "fontFamily": "Inter",
      "fontSize": 12,
      "fontWeight": 400,
      "lineHeight": "18px",
      "letterSpacing": "normal"
    },
    "display": {
      "fontFamily": "Inter",
      "fontSize": 34,
      "fontWeight": 700,
      "lineHeight": "40px",
      "letterSpacing": "normal"
    },
    "h1": {
      "fontFamily": "Inter",
      "fontSize": 28,
      "fontWeight": 700,
      "lineHeight": "36px",
      "letterSpacing": "normal"
    },
    "h2": {
      "fontFamily": "Inter",
      "fontSize": 22,
      "fontWeight": 600,
      "lineHeight": "26px",
      "letterSpacing": "normal"
    },
    "h3": {
      "fontFamily": "Inter",
      "fontSize": 20,
      "fontWeight": 700,
      "lineHeight": "auto",
      "letterSpacing": "normal"
    },
    "body-lg": {
      "fontFamily": "Inter",
      "fontSize": 18,
      "fontWeight": 400,
      "lineHeight": "22px",
      "letterSpacing": "normal"
    },
    "body": {
      "fontFamily": "Inter",
      "fontSize": 16,
      "fontWeight": 400,
      "lineHeight": "auto",
      "letterSpacing": "normal"
    },
    "body-2": {
      "fontFamily": "Inter",
      "fontSize": 15,
      "fontWeight": 400,
      "lineHeight": "22px",
      "letterSpacing": "normal"
    },
    "body-semibold": {
      "fontFamily": "Inter",
      "fontSize": 16,
      "fontWeight": 600,
      "lineHeight": "20px",
      "letterSpacing": "normal"
    },
    "body-semibold-2": {
      "fontFamily": "Inter",
      "fontSize": 15,
      "fontWeight": 600,
      "lineHeight": "22px",
      "letterSpacing": "normal"
    },
    "body-sm": {
      "fontFamily": "Inter",
      "fontSize": 13,
      "fontWeight": 400,
      "lineHeight": "auto",
      "letterSpacing": "normal"
    },
    "body-sm-medium": {
      "fontFamily": "Inter",
      "fontSize": 14,
      "fontWeight": 500,
      "lineHeight": "22px",
      "letterSpacing": "normal"
    },
    "body-sm-semibold": {
      "fontFamily": "Inter",
      "fontSize": 14,
      "fontWeight": 600,
      "lineHeight": "auto",
      "letterSpacing": "normal"
    },
    "body-sm-semibold-2": {
      "fontFamily": "Inter",
      "fontSize": 13,
      "fontWeight": 600,
      "lineHeight": "auto",
      "letterSpacing": "normal"
    },
    "caption-semibold": {
      "fontFamily": "Inter",
      "fontSize": 12,
      "fontWeight": 600,
      "lineHeight": "auto",
      "letterSpacing": "normal"
    }
  },
  "spacing": {
    "space-4": 4,
    "space-5": 5,
    "space-6": 6,
    "space-8": 8,
    "space-10": 10,
    "space-11": 11,
    "space-12": 12,
    "space-14": 14,
    "space-16": 16,
    "space-18": 18,
    "space-20": 20,
    "space-22": 22,
    "space-24": 24,
    "space-28": 28,
    "space-32": 32,
    "space-36": 36,
    "space-40": 40,
    "space-50": 50,
    "space-76": 76
  },
  "radius": {
    "radius-md": 8,
    "radius-sm": 6,
    "radius-sm-2": 4,
    "radius-lg-5": 10,
    "radius-lg-4": 12,
    "radius-lg-3": 14,
    "radius-lg-2": 16,
    "radius-lg": 24
  },
  "shadow": {
    "高保真／阴影／卡片": "0px 4px 12px 0px rgba(15, 23, 41, 0.08)",
    "高保真／阴影／弹窗": "0px 16px 32px 0px rgba(15, 23, 41, 0.16)"
  },
  "fonts": [
    "Inter"
  ]
}
```
