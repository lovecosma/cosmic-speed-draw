require "rails_helper"

RSpec.describe "POST /api/provisional_sessions", type: :request do
  context "with no existing session" do
    it "returns 201" do
      post "/api/provisional_sessions", as: :json
      expect(response).to have_http_status(:created)
    end

    it "creates a provisional user" do
      expect { post "/api/provisional_sessions", as: :json }.to change(ProvisionalUser, :count).by(1)
    end

    it "returns provisional: true" do
      post "/api/provisional_sessions", as: :json
      expect(response.parsed_body.dig("user", "provisional")).to be true
    end

    it "returns nil email" do
      post "/api/provisional_sessions", as: :json
      expect(response.parsed_body.dig("user", "email")).to be_nil
    end

    it "returns the provisional user id" do
      post "/api/provisional_sessions", as: :json
      expect(response.parsed_body.dig("user", "id")).to eq(ProvisionalUser.last.id)
    end

    it "sets the jwt_token cookie" do
      post "/api/provisional_sessions", as: :json
      expect(response.cookies["jwt_token"]).to be_present
    end
  end

  context "with an existing provisional session" do
    let!(:provisional_user) { create(:provisional_user) }
    let(:jwt) { JwtService.encode_provisional(provisional_user.id) }

    before do
      post "/api/provisional_sessions",
        headers: { "Authorization" => "Bearer #{jwt}" },
        as: :json
    end

    it "returns 200" do
      expect(response).to have_http_status(:ok)
    end

    it "reuses the existing provisional user" do
      expect(response.parsed_body.dig("user", "id")).to eq(provisional_user.id)
    end

    it "does not create a new provisional user" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer #{jwt}" },
          as: :json
      }.not_to change(ProvisionalUser, :count)
    end

    it "does not set a new jwt_token cookie" do
      expect(response.cookies["jwt_token"]).to be_blank
    end
  end

  context "with an invalid JWT" do
    it "returns 201" do
      post "/api/provisional_sessions",
        headers: { "Authorization" => "Bearer not.a.valid.token" },
        as: :json
      expect(response).to have_http_status(:created)
    end

    it "creates a new provisional user" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer not.a.valid.token" },
          as: :json
      }.to change(ProvisionalUser, :count).by(1)
    end
  end

  context "with a real user JWT" do
    let!(:user) { create(:user) }

    it "returns 201" do
      post "/api/provisional_sessions",
        headers: { "Authorization" => "Bearer #{JwtService.encode(user.id)}" },
        as: :json
      expect(response).to have_http_status(:created)
    end

    it "creates a new provisional user" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer #{JwtService.encode(user.id)}" },
          as: :json
      }.to change(ProvisionalUser, :count).by(1)
    end
  end
end
