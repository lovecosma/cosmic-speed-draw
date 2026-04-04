FactoryBot.define do
  factory :drawing do
    user { nil }
    title { "MyString" }
    description { "MyText" }
    canvas_data { "" }
    image_url { "MyString" }
    draft { false }
    last_autosaved_at { "2026-04-03 22:09:19" }
  end
end
