require "rails_helper"

RSpec.describe JwtService do
  describe ".encode" do
    it "produces a token with type 'user'" do
      payload = described_class.decode(described_class.encode(1))
      expect(payload["type"]).to eq("user")
    end

    it "embeds the user id as sub" do
      payload = described_class.decode(described_class.encode(42))
      expect(payload["sub"]).to eq("42")
    end

    it "sets exp within the user expiry window" do
      before = Time.current.to_i
      payload = described_class.decode(described_class.encode(1))
      expect(payload["exp"]).to be_between(
        before + JwtService::USER_EXPIRY.to_i - 1,
        Time.current.to_i + JwtService::USER_EXPIRY.to_i + 1
      )
    end
  end

  describe ".encode_provisional" do
    it "produces a token with type 'provisional'" do
      payload = described_class.decode(described_class.encode_provisional(1))
      expect(payload["type"]).to eq("provisional")
    end

    it "embeds the provisional user id as sub" do
      payload = described_class.decode(described_class.encode_provisional(99))
      expect(payload["sub"]).to eq("99")
    end

    it "sets exp within the provisional expiry window" do
      before = Time.current.to_i
      payload = described_class.decode(described_class.encode_provisional(1))
      expect(payload["exp"]).to be_between(
        before + JwtService::PROVISIONAL_EXPIRY.to_i - 1,
        Time.current.to_i + JwtService::PROVISIONAL_EXPIRY.to_i + 1
      )
    end
  end

  describe ".decode" do
    it "returns nil for a tampered token" do
      token = described_class.encode(1)
      tampered = "#{token}x"
      expect(described_class.decode(tampered)).to be_nil
    end

    it "returns nil for an expired token when verify_expiration is true" do
      token = travel_to(JwtService::USER_EXPIRY.ago - 1.second) { described_class.encode(1) }
      expect(described_class.decode(token)).to be_nil
    end

    it "returns the payload for an expired token when verify_expiration is false" do
      token = travel_to(JwtService::USER_EXPIRY.ago - 1.second) { described_class.encode(1) }
      payload = described_class.decode(token, verify_expiration: false)
      expect(payload).not_to be_nil
    end

    it "returns nil for a blacklisted token" do
      token = described_class.encode(1)
      described_class.revoke(token)
      expect(described_class.decode(token)).to be_nil
    end
  end

  describe ".revoke" do
    it "blacklists the jti from the token" do
      token = described_class.encode(1)
      payload_before = described_class.decode(token)
      described_class.revoke(token)
      expect(JwtBlacklist.exists?(jti: payload_before["jti"])).to be true
    end

    it "tolerates an already-expired token" do
      token = travel_to(JwtService::USER_EXPIRY.ago - 1.second) { described_class.encode(1) }
      expect { described_class.revoke(token) }.not_to raise_error
    end

    it "is a no-op for nil" do
      expect { described_class.revoke(nil) }.not_to raise_error
    end
  end
end
