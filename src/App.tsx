import React, { useState, useEffect, useCallback } from 'react';
import { bitable, ITable, IFieldMeta, FieldType } from '@lark-base-open/js-sdk';
import { Alert, Spin, Switch, Typography, Space } from 'antd';
import MarkdownPreview from './components/MarkdownPreview';

const { Text } = Typography;

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ITable | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [textFields, setTextFields] = useState<IFieldMeta[]>([]);
  const [contentCache, setContentCache] = useState<Record<string, string>>({});

  // 初始化表格和字段信息
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const activeTable = await bitable.base.getActiveTable();
        setTable(activeTable);

        // 获取所有字段元数据
        const fieldMetaList = await activeTable.getFieldMetaList();
        
        // 筛选出文本类型字段（可能包含Markdown内容）
        const textFieldList = fieldMetaList.filter(field => 
          field.type === FieldType.Text
        );
        
        setTextFields(textFieldList);
        setLoading(false);

        // 设置单元格点击事件监听
        setupCellClickListener(activeTable);
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败，请刷新页面重试');
        setLoading(false);
      }
    };

    initialize();

    // 清理函数
    return () => {
      // 如果有需要清理的事件监听器，在这里处理
    };
  }, []);

  // 设置单元格点击事件监听
  const setupCellClickListener = useCallback(async (activeTable: ITable) => {
    try {
      // 监听选择变化事件
      bitable.base.onSelectionChange(async (event) => {
        if (!event || !event.data || !event.data.fieldId || !event.data.recordId) {
          return;
        }

        const { fieldId, recordId } = event.data;
        
        // 获取字段元数据
        const fieldMeta = await activeTable.getFieldMetaById(fieldId);
        
        // 检查是否为文本类型字段
        if (fieldMeta && fieldMeta.type === FieldType.Text) {
          // 检查缓存中是否已有内容
          const cacheKey = `${recordId}_${fieldId}`;
          if (contentCache[cacheKey]) {
            setMarkdownContent(contentCache[cacheKey]);
            setPreviewVisible(true);
            return;
          }
          
          // 获取单元格内容
          const cellValue = await activeTable.getCellValue(fieldId, recordId);
          
          // 处理不同类型的单元格值
          let content = '';
          if (typeof cellValue === 'string') {
            content = cellValue;
          } else if (cellValue && typeof cellValue === 'object') {
            // 处理JSON格式的单元格值
            try {
              const jsonStr = typeof cellValue === 'string' ? cellValue : JSON.stringify(cellValue);
              const jsonData = JSON.parse(jsonStr);
              
              // 处理飞书文档格式的JSON数据
              if (Array.isArray(jsonData)) {
                content = jsonData
                  .map(item => {
                    if (item.type === 'text' && item.text) {
                      return item.text;
                    }
                    return '';
                  })
                  .join('');
              } else if (jsonData.type === 'text' && jsonData.text) {
                content = jsonData.text;
              } else if ('text' in jsonData && typeof jsonData.text === 'string') {
                content = jsonData.text;
              } else if ('value' in jsonData && typeof jsonData.value === 'string') {
                content = jsonData.value;
              } else {
                content = JSON.stringify(jsonData);
              }
            } catch (e) {
              // 如果JSON解析失败，尝试直接获取text或value属性
              if ('text' in cellValue && typeof cellValue.text === 'string') {
                content = cellValue.text;
              } else if ('value' in cellValue && typeof cellValue.value === 'string') {
                content = cellValue.value;
              } else {
                content = JSON.stringify(cellValue);
              }
            }
          }
          
          // 更新缓存
          setContentCache(prev => ({
            ...prev,
            [cacheKey]: content
          }));
          
          // 显示预览
          setMarkdownContent(content);
          setPreviewVisible(true);
        }
      });
    } catch (err) {
      console.error('设置单元格点击事件监听失败:', err);
      setError('设置单元格点击事件监听失败');
    }
  }, [contentCache]);

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewVisible(false);
  };

  // 切换主题模式
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 清除缓存
  const clearCache = () => {
    setContentCache({});
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert message="错误" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert 
          message="Markdown预览插件" 
          description="点击包含Markdown内容的单元格，将自动显示渲染后的预览。" 
          type="info" 
          showIcon 
        />
        
        <Space>
          <Text>暗黑模式:</Text>
          <Switch checked={isDarkMode} onChange={toggleDarkMode} />
        </Space>
        
        <div>
          <Text type="secondary">可预览的字段类型: 文本, 多行文本</Text>
        </div>
        
        {textFields.length === 0 && (
          <Alert 
            message="未找到文本字段" 
            description="请在表格中添加文本或多行文本字段以使用Markdown预览功能。" 
            type="warning" 
            showIcon 
          />
        )}
      </Space>

      {/* Markdown预览组件 */}
      <MarkdownPreview 
        content={markdownContent} 
        visible={previewVisible} 
        onClose={handleClosePreview} 
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default App;