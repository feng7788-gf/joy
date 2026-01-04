
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGameAIResponse = async (gameType: string, boardState: string, difficulty: string = "normal") => {
  try {
    const instructions: Record<string, string> = {
      easy: "你是一个初级玩家。请快速给出一个移动。",
      normal: "你是一个资深棋手。棋路务必稳健。对于五子棋，必须严防对方的三连和四连，同时寻找自己的连五机会。",
      hard: "你是一个顶级大师。象棋：计算深、攻守兼备。五子棋：绝对不允许漏掉对方的活三和冲四，必须在1秒内通过精简逻辑给出最佳拦截或制胜点。优先形成自己的五子连珠。"
    };

    const modelName = 'gemini-3-flash-preview';

    const prompt = gameType === 'Chinese Chess' 
      ? `你是一个顶级的中国象棋大师。
      
      当前棋盘状态（R红B黑，.为空）：
      ${boardState}
      
      你执黑(BLACK)。难度：${difficulty}。
      核心目标：${instructions[difficulty] || instructions.normal}
      
      必须遵循走法规则。严禁送帅。
      请给出下一步移动。
      输出严格JSON：{"move": "sr,sc,tr,tc", "reason": "逻辑"}`
      : `你是一个专业的${gameType}大师级AI。
      当前棋盘状态：
      ${boardState}
      
      目标：${instructions[difficulty] || instructions.normal}
      注意：五子棋中，拦截对方的活三和活四是最高优先级。如果有成五的机会，必须立即成五。
      请决定下一步移动（r,c坐标）。JSON: {"move": "r,c", "reason": "分析原因"}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["move", "reason"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Move Generation Error:", error);
    return null;
  }
};

export const analyzeMahjongHand = async (hand: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `麻将高手分析。手牌：${hand.join(', ')}。JSON: {"discard": "牌名", "explanation": "理由"}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            discard: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["discard", "explanation"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (e) {
    return { discard: hand[0], explanation: "随缘出牌。" };
  }
};
