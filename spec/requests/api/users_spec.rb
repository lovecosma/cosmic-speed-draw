require "rails_helper"

RSpec.describe "GET /api/user", type: :request do
  context "without authentication" do
    before { get "/api/user", as: :json }

    it "returns 401" do
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context "with an invalid token" do
    before do
      get "/api/user", headers: { "Authorization" => "Bearer not.a.valid.token" }, as: :json
    end

    it "returns 401" do
      expect(response).to have_http_status(:unauthorized)
    end
  end

  context "as a real user" do
    let!(:user) { create(:user) }
    let(:jwt) { JwtService.encode(user.id) }

    before { get "/api/user", headers: { "Authorization" => "Bearer #{jwt}" }, as: :json }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "returns the user id" do
      expect(response.parsed_body.dig("user", "id")).to eq(user.id)
    end

    it "returns the user email" do
      expect(response.parsed_body.dig("user", "email")).to eq(user.email)
    end

    it "returns provisional: false" do
      expect(response.parsed_body.dig("user", "provisional")).to be false
    end
  end

  context "as a provisional user" do
    let!(:user) { create(:user, :provisional) }
    let(:jwt) { JwtService.encode(user.id) }

    before { get "/api/user", headers: { "Authorization" => "Bearer #{jwt}" }, as: :json }

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "returns the user id" do
      expect(response.parsed_body.dig("user", "id")).to eq(user.id)
    end

    it "returns nil email" do
      expect(response.parsed_body.dig("user", "email")).to be_nil
    end

    it "returns provisional: true" do
      expect(response.parsed_body.dig("user", "provisional")).to be true
    end
  end

  context "with a blacklisted token" do
    let!(:user) { create(:user) }
    let(:jwt) { JwtService.encode(user.id) }

    before do
      JwtService.revoke(jwt)
      get "/api/user", headers: { "Authorization" => "Bearer #{jwt}" }, as: :json
    end

    it "returns 401" do
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
