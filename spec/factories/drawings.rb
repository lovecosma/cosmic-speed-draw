FactoryBot.define do
  factory :drawing do
    association :user
    sequence(:title) { |n| "Drawing #{n}" }
    description { "A test drawing" }
    canvas_data { { shapes: [] } }
    image_url { nil }
    last_autosaved_at { nil }
  end
end
