require "rails_helper"

RSpec.describe JwtBlacklist, type: :model do
  describe "validations" do
    it "is valid with a jti and exp" do
      expect(build(:jwt_blacklist)).to be_valid
    end

    it "requires a jti" do
      expect(build(:jwt_blacklist, jti: nil)).not_to be_valid
    end

    it "requires a unique jti" do
      create(:jwt_blacklist, jti: "duplicate-jti")
      expect(build(:jwt_blacklist, jti: "duplicate-jti")).not_to be_valid
    end

    it "requires an exp" do
      expect(build(:jwt_blacklist, exp: nil)).not_to be_valid
    end
  end
end
