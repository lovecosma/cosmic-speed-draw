FactoryBot.define do
  factory :jwt_blacklist do
    sequence(:jti) { |n| "jti-#{n}-#{SecureRandom.hex(8)}" }
    exp { 1.day.from_now }
  end
end
