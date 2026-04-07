FactoryBot.define do
  factory :drawing do
    association :user
    provisional_user { nil }
    sequence(:title) { |n| "Drawing #{n}" }
    description { "A test drawing" }
    canvas_data { { shapes: [] } }
    image_url { nil }
    last_autosaved_at { nil }

    trait :provisional do
      user { nil }
      association :provisional_user
    end
  end
end
