# Claude Code Skill 備份

`pitching-mechanics-analysis/` 是這個專案在用的 Claude Code Skill 的備份副本。**這不是活動中的 Skill** —— 真正會被 Claude Code 使用的版本存在使用者電腦上的 `~/.claude/skills/pitching-mechanics-analysis/`,跟這個 git 專案是分開的位置,不會自動同步。

這份備份的用途是:換一台電腦、或原本的 Skill 不小心壞掉/搞丟時,可以照著這份重建。

## 在新電腦上安裝這個 Skill

```bash
mkdir -p ~/.claude/skills/pitching-mechanics-analysis
cp -r docs/claude-skill-backup/pitching-mechanics-analysis/* ~/.claude/skills/pitching-mechanics-analysis/
chmod +x ~/.claude/skills/pitching-mechanics-analysis/scripts/*.sh ~/.claude/skills/pitching-mechanics-analysis/scripts/*.py
```

或者更簡單:在新電腦上開一個 Claude Code 對話,把這個 GitHub 專案網址給它,請它照 `docs/claude-skill-backup/` 裡的內容重建 Skill。

## 保持同步

之後如果請 Claude 更新 Skill(例如新增功能、調整判斷邏輯),記得也請它把這份備份一起更新,不然兩邊會不一致。
