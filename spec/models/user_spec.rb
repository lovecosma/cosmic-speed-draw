require "rails_helper"

RSpec.describe User, type: :model do
  subject(:user) { build(:user) }

  describe "validations" do
    it { is_expected.to be_valid }

    it "requires an email" do
      user.email = nil
      expect(user).not_to be_valid
    end

    it "requires a unique email" do
      create(:user, email: "taken@example.com")
      user.email = "taken@example.com"
      expect(user).not_to be_valid
    end

    it "requires a password" do
      user.password = nil
      expect(user).not_to be_valid
    end

    it "requires password to be at least 6 characters" do
      user.password = "short"
      user.password_confirmation = "short"
      expect(user).not_to be_valid
    end
  end

  describe "devise modules" do
    it "authenticates with correct password" do
      user.save!
      expect(user.valid_password?("password123")).to be true
    end

    it "rejects incorrect password" do
      user.save!
      expect(user.valid_password?("wrong")).to be false
    end
  end

  describe "JWT revocation" do
    it "uses JwtBlacklist as the revocation strategy" do
      expect(described_class.jwt_revocation_strategy).to eq(JwtBlacklist)
    end
  end
end
