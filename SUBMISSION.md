**Note: this file must be entirely hand-typed by you. Do not generate or edit it with any AI tool. Any SUBMISSION.md containing AI-generated content will be voided.**

# Assumptions
What assumptions did you make about the task, if any?

- upstream review ID : the review id returned by the provider is the actual amazon review id. I verified it by opening the amazon review url directly, so I used it as the only identifier for each review instead of finding other methods to uniquely identify each review .

- rate limiting: i assumed the scraping provider could return rate limiting or temporary errors. because of that, i added retries with wait times and limited it to a maximum of 3 retries instead of continuously hitting the api and wasting requests.

- review updates: i assumed reviews can change over time like helpful votes or edited content, so existing reviews should be updated when they are fetched again instead of ignored .

- top reviews : the scraping provider only returns top reviews. getting the latest reviews requires authenticated amazon scraping services, which wasn't available, so i used the top reviews returned by the provider.

- scraping provider : I assumed using an existing scraping service was fine for this assignment. building and maintaining a reliable amazon scraper would take much more time, so I focused on consuming the data, normalizing it, and building the ingestion pipeline.

- single review source : I assumed the application only needs amazon reviews for now. If support for other marketplaces like flipkart is added in the future, the uniqueness should be changed from just review_id to a composite key like (source, review_id) to avoid collisions.


# What you built
Explain what you built, your key decisions, and the trade-offs you made.
- used the Rainforest API to fetch Amazon reviews and mapped the response into a common review model used by the application.

- implemented the complete review ingestion pipeline with PostgreSQL and Knex. Reviews are stored using the Amazon review_id as the unique identifier, and existing reviews are updated if they are fetched again.

- added retry handling with increasing wait time (up to 3 attempts) to handle temporary API failures and rate limiting.

- built filtering by ASIN, rating, and search text, along with pagination for browsing reviews.

- added global toast notifications to show users whether an action completed successfully or failed.

- protected all API endpoints using a shared bearer secret.

- added Docker Compose support for running PostgreSQL, along with scripts to run only the database or the complete application setup.

tradeoffs:

  - used an existing scraping provider instead of building an amazon scraper from scratch because building a reliable scraper was outside the scope and time available for this assignment.

  - the provider only returns top reviews. getting the latest reviews requires authenticated amazon access, so the application uses the reviews returned by the provider.

# Tools & tech stack
What tools and technologies did you use to build this?

- framework: next.js(app router), React, TypeScript
- database: postgresql
- database client: knex.js
- styling & UI: tailwind css, lucide icons
- deployment & containers: docker, docker compose

# AI tools used
Which AI tools did you use, and for which parts of the work? what models did you use?

ans -  mainly chatgpt for planning and claude sonnet and gemini for code generations using antigravity ide.

# Representative prompts
Share 3–5 of your most useful prompts, and briefly explain what each one accomplished.

1. "Refactor the review ingestion implementation to replace the current scraper integration with the new review provider (Rainforest API). Set up the RainforestProvider class using the canonical review ID for deduplication, with linear backoff retries."   -

 result successfully isolated the provider logic and implemented a retry/sleep loop for api's error and ratelimiting issue.

2. "Protect every API endpoint using a shared bearer secret. Add a global toast notification system in Tailwind CSS for all client fetches showing green on success and red on failure."

   result implemented toasts and auth headers across frontend pages and api endpoints.
3. "Set up Prettier for the project and add the required scripts to package.json for consistent code formatting."

 result configured Prettier, added the required formatting scripts to package.json, and formatted the codebase to maintain a consistent coding style.

# Catching AI mistakes
Where did AI get something wrong, and how did you catch and correct it?

ans - one of the main issues i found was around the database setup. AI initially implemented the schema by creating function that create tables whenever the application connected to the database instead of using proper knex migration files. i did not think that was a good approach because schema changes should be managed through migrations, so I changed it to use migrations instead.

other than that, most of the generated code was correct, but it missed a few project standards. for example, it forgot to set up prettier, there were a few small consistency issues, and some parts needed cleanup to better match the projects coding standards. They werenot major problems, but I reviewed the generated code carefully and made those changes myself instead of accepting everything.


# AI reliance & cost (optional)
Roughly how heavily did you rely on AI? How many tokens did you spend? If you used the API directly and tracked token usage or cost, share it here.

ans- I used ai a lot for this project, mainly chatgpt for planning and Claude sonnet and gemini for code generations using antigravity ide. i still went through the generated code, understood it, and changed things wherever it didn't match what I wanted . 

the architecture and approaches, and project standards were planned by me. I also spent around an hour researching the best way to fetch amazon reviews and try out each availble servies. building a reliable scraper from scratch wasn't practical in this time frame, so I decided to use an existing scraping service and focused on building the ingestion pipeline around it . I did not track the token usage or cost. I have chatGPT and google ai subscriptions, so I was not monitoring tokens or api costs during development.