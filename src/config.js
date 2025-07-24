// config.js
const config = {
  elasticsearchBaseURL: 'https://your-elastic-utl',
  elasticsearchAuth: {
    username: 'your-user',
    password: 'your-users-pass'
  },
  azureOpenAIEndpoint: 'https://your-azure-OpenAiEndpoint',
  azureOpenAIApiKey: 'your-OpenAi-API-key',
  indicesList: [
    { name: 'STAR WARS Chat', index: 'starwars-semantic-enriched', semantic_field: 'paragraph' },
    { name: 'Bible Chat', index: 'bible-kjv-semantic-enriched', semantic_field: 'verse' },
    // Add more options here
  ]
};

export default config;
