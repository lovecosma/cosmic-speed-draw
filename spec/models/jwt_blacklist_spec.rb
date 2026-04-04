require "rails_helper"

RSpec.describe JwtBlacklist, type: :model do
  describe "revocation strategy" do
    it "includes the Denylist strategy" do
      expect(described_class).to include(Devise::JWT::RevocationStrategies::Denylist)
    end

    it "revokes a token by adding it to the blacklist" do
      payload = { "jti" => SecureRandom.uuid, "exp" => 1.day.from_now.to_i }
      described_class.revoke_jwt(payload, nil)

      expect(described_class.where(jti: payload["jti"]).exists?).to be true
    end

    it "confirms a non-blacklisted token is not revoked" do
      payload = { "jti" => SecureRandom.uuid, "exp" => 1.day.from_now.to_i }

      expect(described_class.jwt_revoked?(payload, nil)).to be false
    end

    it "confirms a blacklisted token is revoked" do
      payload = { "jti" => SecureRandom.uuid, "exp" => 1.day.from_now.to_i }
      described_class.revoke_jwt(payload, nil)

      expect(described_class.jwt_revoked?(payload, nil)).to be true
    end
  end

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
