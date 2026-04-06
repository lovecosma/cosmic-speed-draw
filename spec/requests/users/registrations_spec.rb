require "rails_helper"

RSpec.describe "POST /api/users (registrations)", type: :request do
  let(:valid_params) do
    { user: { email: "new@example.com", password: "password123", password_confirmation: "password123" } }
  end

  context "with valid params" do
    before { post "/api/users", params: valid_params, as: :json }

    it "returns provisional: false" do
      expect(response.parsed_body.dig("user", "provisional")).to be false
    end

    it "sets the jwt_token cookie" do
      expect(response.cookies["jwt_token"]).to be_present
    end

    it "sets the refresh_token cookie" do
      expect(response.cookies["refresh_token"]).to be_present
    end
  end

  context "with a password confirmation mismatch" do
    before do
      post "/api/users",
        params: { user: { email: "new@example.com", password: "password123", password_confirmation: "wrong" } },
        as: :json
    end

    it "returns an error message" do
      expect(response.parsed_body["errors"]).to include("Password confirmation doesn't match Password")
    end
  end

  context "with a provisional session" do
    let!(:provisional_user) { create(:user, :provisional) }
    let(:jwt) { JwtService.encode(provisional_user.id) }

    before do
      post "/api/users",
        params: valid_params,
        headers: { "Authorization" => "Bearer #{jwt}" },
        as: :json
    end

    it "blacklists the provisional JWT" do
      expect(JwtBlacklist.count).to eq(1)
    end
  end
end
