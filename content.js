chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    let selectedText = message.text
    if(!selectedText){
        selectedText = window.getSelection().toString().trim();
    }
    
    console.log("content....",selectedText)
    if (selectedText) {
      const response = await fetchOpenAI(selectedText)
      
      try {
        // Read the response as a stream of data
        const decoder = new TextDecoder("utf-8");
        resultText = "";
    
        while (true) {
          const { done, value } = await response.read();
          if (done) {
            break;
          }
          // Massage and parse the chunk of data
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n");
          const parsedLines = lines
            .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
            .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
            .map((line) => JSON.parse(line)); // Parse the JSON string
    
          for (const parsedLine of parsedLines) {
            const { choices } = parsedLine;
            const { delta } = choices[0];
            const { content } = delta;
            // Update the UI with the new content
            if (content) {
              resultText += content;
              updatePopupContent(resultText);
            }
          }
        }
    } catch(error) {
        console.error(error)
    }
    
    }
  });
  
  function updatePopupContent(content) {
    let popup = document.getElementById("aiAssistantPopup")
    if (!popup){
        popup = document.createElement('div');
        popup.id = 'aiAssistantPopup';
        
        document.body.appendChild(popup);

         // 添加点击事件监听器，点击弹出层时移除它
         popup.addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }
    popup.textContent = content;
  
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
  
    popup.style.top = `${rect.bottom + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
      const selectedText = window.getSelection().toString().trim();
      sendResponse({ text: selectedText });
    }
  });

async function fetchOpenAI(prompt) {
    const { modelSettings = {} } = await chrome.storage.sync.get('modelSettings');
    if(Object.keys(modelSettings).length === 0){
      alert("请先选择模型")
      throw new Error("api key error");
    }
    if(!modelSettings["api_key"]){
      alert("请先设置模型api key")
      throw new Error("api key error");
    }
    const apiKey = modelSettings["api_key"]
    const endpoint = modelSettings["base_url"]+"/chat/completions"
    const model = modelSettings["model"]
    const eng_level = modelSettings["eng_level"]
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        'model': model,
        'messages': [
          {'role':'system',
            'content':"下面我让你来充当翻译家，你的目标是把任何语言翻译成中文，请翻译时不要带翻译腔，而是要翻译得自然、流畅和地道，\
            使用优美和高雅的表达方式。请根据用户的英语水平："+eng_level+",对于结果复杂\
            的句子，分析语法结构和词组。输出格式参考(如果没有需要解释的，对应段落不用出）：\
            xx （句子翻译）\
            xx 对难词、语法做解释，每个词一行\
            xx，对其中的专业词语做解释"
          },
          {
            'role': 'user',
            'content': "请翻译："+ prompt
          }
        ],
        "stream": true,
        max_tokens: 4000, // 生成的最大 tokens 数
        temperature: 0.7, // 控制生成文本的随机性
        n: 1 // 生成的回复数量
      })
    };
  
    try {
      const response = await fetch(endpoint, requestOptions);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.body.getReader();
      // const data = await response.json();
      // return data.choices[0].messages.content;
    } catch (error) {
      console.error('Error fetching OpenAI API:', error);
      throw error;
    }
  }

