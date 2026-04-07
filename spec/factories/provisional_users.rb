FactoryBot.define do
  factory :provisional_user do
    last_seen_at { Time.current }
  end
end
