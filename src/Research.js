import React from 'react';
import './Research.css';

function Research() {
  return (
    <div className="research-container">
      <h1>Research</h1>
      <div className="citations">
        <h2>[citations]:</h2>
        <ol>
          <li>
            <a href="https://arxiv.org/abs/2110.00976" target="_blank" rel="noopener noreferrer">
              Kosmos-2: Grounding Multimodal Large Language Models to the World
            </a>
          </li>
          <li>
            <a href="https://huggingface.co/nlpaueb/legal-bert-base-uncased" target="_blank" rel="noopener noreferrer">
              LEGAL-BERT: The Muppets straight out of Law School
            </a>
          </li>
          <li>
            <a href="https://arxiv.org/abs/2304.12202" target="_blank" rel="noopener noreferrer">
              Guanaco: Quadrupling the sample efficiency of large language models for semi-structured few-shot learning
            </a>
          </li>
          <li>
            <a href="https://ai.meta.com/research/publications/seamless-multilingual-expressive-and-streaming-speech-translation/" target="_blank" rel="noopener noreferrer">
              Seamless: Multilingual Expressive and Streaming Speech Translation
            </a>
          </li>
          <li>
            <a href="https://scontent-lga3-1.xx.fbcdn.net/v/t39.2365-6/406941874_247486308347770_2317832131512763077_n.pdf" target="_blank" rel="noopener noreferrer">
              Seamless Communication: Breaking Language Barriers through Multilingual Speech Translation
            </a>
          </li>
          <li>
            <a href="https://www.semanticscholar.org/paper/Is-ChatGPT-A-Good-Translator-Yes-With-GPT-4-As-The-Jiao-Wang/780c99d13537370f63c03feeb1343bed9d98a4f9" target="_blank" rel="noopener noreferrer">
              Is ChatGPT A Good Translator? Yes With GPT-4 As The Engine
            </a>
          </li>
          <li>
            <a href="https://chatgpt.com/share/e/92c45572-cf03-41fd-af86-09359034b7cc" target="_blank" rel="noopener noreferrer">
              ChatGPT Share: Comparison of Translation Systems
            </a>
          </li>
        </ol>
      </div>
      <div className="research-image">
        <img src="https://image.pollinations.ai/prompt/Table_comparing_translation_systems_showing_BLEU,_ChrF++,_and_TER_scores_for_Google,_DeepL,_Tencent,_and_ChatGPT_with_different_prompts" alt="Comparison of Translation Systems" />
        <p>Figure 1: Comparison of Translation Systems</p>
      </div>
    </div>
  );
}

export default Research;