// app/test-guided/page.tsx
"use client";
import CodeLessonBase from "@/src/lesson-core/CodeLessonBase";
import React from "react";

export default function TestGuidedPage() {
  const [stats, setStats] = React.useState({
    wrongAttempts: 0,
    tasksCompleted: 0,
    lastCheckErrors: 0,
    totalBlanks: 0,
    checkAttempts: 0,
    overallProgress: 0
  });

  // 实时监听器：监控所有相关的统计变量
  React.useEffect(() => {
    const interval = setInterval(() => {
      try {
        // 监听 GuidedCodeBlock 的填空统计
        const attemptsData = localStorage.getItem('test-guided:blankAttemptsByName');
        const statusData = localStorage.getItem('test-guided:blankStatus');
        const checkAttemptsData = localStorage.getItem('test-guided:checkAttempts');
        
        // 监听 CodeLessonBase 的整体进度
        const progressData = localStorage.getItem('test-guided:overallProgress');
        const doneSetData = localStorage.getItem('test-guided:doneSet');
        
        const attempts = attemptsData ? JSON.parse(attemptsData) : {};
        const status = statusData ? JSON.parse(statusData) : {};
        const totalChecks = checkAttemptsData ? parseInt(checkAttemptsData) : 0;
        const overallProgress = progressData ? parseInt(progressData) : 0;
        const doneSet = doneSetData ? JSON.parse(doneSetData) : [];
        
        // 计算实时统计
        const wrongAttempts = Object.values(attempts).reduce((sum: number, count: any) => sum + count, 0);
        const correctBlanks = Object.values(status).filter(s => s === true).length;
        const totalBlanks = Object.keys(status).length;
        const tasksCompleted = doneSet.length; // 完成的任务数量
        
        setStats({
          wrongAttempts,
          tasksCompleted,
          lastCheckErrors: totalBlanks - correctBlanks,
          totalBlanks,
          checkAttempts: totalChecks,
          overallProgress
        });
      } catch (error) {
        console.log('统计信息暂不可用');
      }
    }, 500); // 每500ms更新一次
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8fafc', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* 实时统计监控面板 */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h1 style={{ 
          marginBottom: '20px', 
          color: '#1e293b',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          🎯 GuidedCodeBlock 实时监控面板
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <StatBox 
            title="❌ 错误尝试次数" 
            value={stats.wrongAttempts} 
            color="#ef4444" 
            description="用户填错答案的总次数"
          />
          <StatBox 
            title="✅ 完成的任务" 
            value={stats.tasksCompleted} 
            color="#10b981" 
            description="标记为完成的任务数量"
          />
          <StatBox 
            title="📊 总进度" 
            value={`${stats.overallProgress}%`} 
            color="#3b82f6" 
            description="课程整体完成进度"
          />
          <StatBox 
            title="🔍 检查次数" 
            value={stats.checkAttempts} 
            color="#8b5cf6" 
            description="点击检查按钮的总次数"
          />
          <StatBox 
            title="⏳ 当前错误" 
            value={stats.lastCheckErrors} 
            color="#f59e0b" 
            description="最后一次检查的错误数量"
          />
          <StatBox 
            title="📝 总空白数" 
            value={stats.totalBlanks} 
            color="#64748b" 
            description="当前步骤的填空总数"
          />
        </div>
        
        <div style={{ 
          fontSize: '14px', 
          color: '#64748b',
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '6px',
          borderLeft: '4px solid #3b82f6'
        }}>
          <p><strong>监控说明：</strong>此页面实时监控 CodeLessonBase 和 GuidedCodeBlock 的交互数据。</p>
          <p>所有统计信息每500毫秒自动更新，无需刷新页面。</p>
        </div>
      </div>

      {/* 嵌入完整的课程内容 */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        minHeight: '600px'
      }}>
        <CodeLessonBase 
          // 使用独立的存储前缀，避免与主应用冲突
          storagePrefix="test-guided"
          apiBaseUrl="http://localhost:4000"
          analyticsTag="test-guided"
          // 不传递 lessonSteps，让组件使用默认或内置的课程数据
        />
      </div>
    </div>
  );
}

// 统计信息组件
function StatBox({ 
  title, 
  value, 
  color, 
  description 
}: { 
  title: string; 
  value: number | string; 
  color: string; 
  description?: string;
}) {
  return (
    <div style={{ 
      background: '#f8fafc', 
      padding: '16px', 
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '14px', 
        color: '#64748b', 
        marginBottom: '8px',
        fontWeight: '500'
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      {description && (
        <div style={{ 
          fontSize: '12px', 
          color: '#94a3b8',
          lineHeight: '1.3'
        }}>
          {description}
        </div>
      )}
    </div>
  );
}