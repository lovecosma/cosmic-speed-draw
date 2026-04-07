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
    let!(:provisional_user) { create(:provisional_user, last_seen_at: 1.day.ago) }
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

    it "sets a fresh jwt_token cookie" do
      expect(response.cookies["jwt_token"]).to be_present
      expect(response.cookies["jwt_token"]).not_to eq(jwt)
    end

    it "updates last_seen_at" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer #{jwt}" },
          as: :json
      }.to change { provisional_user.reload.last_seen_at }
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

  context "with an expired provisional JWT" do
    let!(:provisional_user) { create(:provisional_user, last_seen_at: 8.days.ago) }
    let(:jwt) { travel_to(8.days.ago) { JwtService.encode_provisional(provisional_user.id) } }

    it "returns 200 and reuses the provisional user" do
      post "/api/provisional_sessions",
        headers: { "Authorization" => "Bearer #{jwt}" },
        as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "id")).to eq(provisional_user.id)
    end

    it "issues a fresh provisional JWT cookie" do
      post "/api/provisional_sessions",
        headers: { "Authorization" => "Bearer #{jwt}" },
        as: :json

      expect(response.cookies["jwt_token"]).to be_present
    end

    it "does not create a new provisional user" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer #{jwt}" },
          as: :json
      }.not_to change(ProvisionalUser, :count)
    end

    it "updates last_seen_at" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer #{jwt}" },
          as: :json
      }.to change { provisional_user.reload.last_seen_at }
    end
  end

  context "with an expired provisional JWT and last_seen_at older than 30 days" do
    let!(:provisional_user) { create(:provisional_user, last_seen_at: 31.days.ago) }
    let(:jwt) { travel_to(31.days.ago) { JwtService.encode_provisional(provisional_user.id) } }

    it "returns 201 with a new provisional user" do
      post "/api/provisional_sessions",
        headers: { "Authorization" => "Bearer #{jwt}" },
        as: :json

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("user", "id")).not_to eq(provisional_user.id)
    end

    it "creates a new provisional user" do
      expect {
        post "/api/provisional_sessions",
          headers: { "Authorization" => "Bearer #{jwt}" },
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
