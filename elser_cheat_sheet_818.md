# Cheat sheet for getting ELSER working on a Data Set with Full example

[Cheat Sheet](#cheat-sheet)

[Full Example (Star Wars)](#full-example-\(star-wars\))

# Cheat Sheet {#cheat-sheet}

The following text is safe to cut and paste into Dev Tools, and modify to your liking by changing the highlighted text.   

11/9 \- Updated for ELSER V2,   
7/25 \- updated semantic\_text and 8.18/9.0

\# \==================================================================  
\# Elastic Learned Sparse EncodeR testing  
\# \==================================================================  
\# Step by step instructions…  
\#   
\# Step 1: First you ingest the text file, you’ll want a main field   
\# that has your text as \<indexname\>  
\# Step 2: The latest Elastic 8.18/9.0 has .elser-2 inference endpoint   
\# enabled by default.  You don’t need any special steps with   
\# semantic\_text field either  
\# Read more about ELSER here: [https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-elser.html](https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-elser.html)  
\# Step 3: Create a new index which will contain the tokens by first   
\# putting a "semantic\_text" field in the mapping, this does lots of   
\# things for you including chunking, which I am not testing here  
\# see: https://www.elastic.co/docs/solutions/search/semantic-search/semantic-search-semantic-text  
PUT \<indexname-semantic-enriched\>  
{  
  "mappings": {  
    "properties": {  
      "paragraph": {  
        "type": "semantic\_text"  
      }  
    }  
  }  
}

\# Step 4: you will need to reindex the raw index ingested \<indexname\>   
\# using the pipeline adding the tokenized fields to the newly   
\# created index \<indexname-enriched\>  
\# Add a ?wait\_for\_completion=false to the request to run the job   
\# asynchronously see: [https://www.elastic.co/docs/solutions/search/semantic-search/semantic-search-semantic-text\#semantic-text-reindex-data](https://www.elastic.co/docs/solutions/search/semantic-search/semantic-search-semantic-text#semantic-text-reindex-data)

POST \_reindex?wait\_for\_completion=false  
{  
  "source": {  
    "index": "\<indexname\>",  
    "size": 10  
  },  
  "dest": {  
    "index": "\<indexname-semantic-enrished\>"  
   }  
}  
\# that reindex call will give you a task number, you can check the   
\# status of progress, this will take a while  
GET \_tasks/\<task\_id\>  
\#  
\#   
\# After the reindex, you can now query the rank features field using  
\# text expansion query, see: [https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-text-expansion-query.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-text-expansion-query.html)  
GET \<indexname-semantic-enriched\>/\_search  
{  
   "query":{  
      "semantic":{  
         "field":"field\_name",  
         "query":"your question?"  
      }  
   }  
}

# Full Example (Star Wars) {#full-example-(star-wars)}

Here is a full walk through example with [Star Wars the original novel “A New Hope”](https://github.com/cehaletx/pub/blob/main/openai-elastic-examples/starwars-version/starwars-text/starwars.json).  This is all text below you can use in Dev Tools.  Note: step 1 and 2 are point and click, this is just comments below.

\#   
**\# Step 1** \- Ingest the json using kibana “Upload a File” name the index   
\# starwars-novel  
\#  
\# check your text uploaded  
GET starwars-novel/\_search  
\#  
\# **Step 2** \- the latest Elastic 8.18+ has .elser-2-elasticsearch inference endpoint enabled by default  
\# **Step 3** \- create your mapping with a semantic\_text field  
`Starwars`  
PUT starwars-semantic-enriched  
{  
 "mappings": {  
   "properties": {  
     "paragraph": {  
       "type": "semantic\_text"  
     }  
   }  
 }  
}

\# **Step 4** \- Reindex the original to the new index with semantic\_text field, it’s magic\!  
POST \_reindex?wait\_for\_completion=false  
{  
  "source": {  
    "index": "starwars-novel",  
    "size": 10  
  },  
  "dest": {  
    "index": "starwars-semantic-enriched"  
   }  
}  
GET \_tasks/\<task\_id\>

\# once that is completed you can start asking questions  
GET starwars-semantic-enriched/\_search  
{  
   "query":{  
      "semantic":{  
         "field":"paragraph",  
         "query":"where does Luke live?"  
      }  
   }  
}  
