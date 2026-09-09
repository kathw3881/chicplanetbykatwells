# Example Agent Prompts

Paste these to your ChatGPT agent once the connector is attached. The agent
should call `get_brand_profile` first so everything stays on-brand and in
British English.

## Getting started

- "Call `get_brand_profile` and `get_store_status`, then summarise the state of
  my Chic Planet store and what I should focus on this month."
- "What seasonal opportunities are coming up, and which collections should I push?"

## Product manager

- "Pull my live Teemill products with `teemill_list_products` and import the top
  5 into the manager."
- "For each product in the Empowerment Edit, suggest an improved name, a richer
  description and SEO copy. Save them as drafts with `save_product_suggestions`,
  then queue each for approval with clear manual steps."
- "Recommend better collection placement for any product that looks misfiled."

## Promotion watcher

- "I'm going to paste a Teemill promo email. Extract the code, dates, minimum
  spend and terms, save it with `save_promo_offer`, and create a homepage banner,
  an Instagram caption and a 3-step promo plan. Don't invent any details I didn't
  give you."

## Website update assistant

- "Draft a June Pride homepage hero, an announcement bar for free shipping, and a
  monthly homepage update checklist. Save them as website drafts."
- "Suggest which products to feature and which to demote for summer, and queue a
  'write' approval to publish the new hero with manual steps and a rollback note."

## Design idea generator

- "Generate 5 disability-positive tote bag designs. For each, give a slogan,
  visual style, colour palette, a Canva prompt, Teemill-safe production notes,
  target audience and a matching social caption. Save them with
  `save_design_idea`."
- "Give me 3 festival-themed t-shirt ideas and 2 eco-conscious mug ideas."

## Social content generator

- "Write a TikTok script, an Instagram caption, a WhatsApp Channel post and a
  YouTube Community post to launch the Different Is Brilliant tee. Save each with
  `save_social_post`."
- "Create a Canva Pro prompt for a 15-second Summer Picks promo video."

## Approvals (safety)

- "Show me all pending approvals."
- "Approve approval #1." (a normal write action)
- "Approve approval #2." → the agent must re-confirm because it is a **dangerous**
  action; reply: "Yes, confirm the dangerous action for approval #2."
- "Show me the audit log for the last 20 actions."
