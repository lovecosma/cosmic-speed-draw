require "rails_helper"

RSpec.describe "Auth", type: :request do
  describe "POST /api/users (sign up)" do
    let(:valid_params) do
      { user: { email: "new@example.com", password: "password123", password_confirmation: "password123" } }
    end

    context "with valid params" do
      it "returns 201 with user data" do
        post "/api/users", params: valid_params, as: :json

        expect(response).to have_http_status(:created)
        expect(json["user"]["email"]).to eq("new@example.com")
        expect(json["user"]).not_to have_key("password")
      end

      it "returns a JWT in the Authorization header" do
        post "/api/users", params: valid_params, as: :json

        expect(response.headers["Authorization"]).to match(/\ABearer .+\z/)
      end

      it "creates a user" do
        expect {
          post "/api/users", params: valid_params, as: :json
        }.to change(User, :count).by(1)
      end
    end

    context "with invalid params" do
      it "returns 422 when email is taken" do
        create(:user, email: "new@example.com")
        post "/api/users", params: valid_params, as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json["errors"]).to include("Email has already been taken")
      end

      it "returns 422 when password confirmation doesn't match" do
        post "/api/users", params: { user: { email: "new@example.com", password: "password123", password_confirmation: "wrong" } }, as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "POST /api/users/sign_in" do
    let!(:user) { create(:user, email: "user@example.com", password: "password123") }

    context "with valid credentials" do
      it "returns 200 with user data" do
        post "/api/users/sign_in", params: { user: { email: "user@example.com", password: "password123" } }, as: :json

        expect(response).to have_http_status(:ok)
        expect(json["user"]["email"]).to eq("user@example.com")
      end

      it "returns a JWT in the Authorization header" do
        post "/api/users/sign_in", params: { user: { email: "user@example.com", password: "password123" } }, as: :json

        expect(response.headers["Authorization"]).to match(/\ABearer .+\z/)
      end
    end

    context "with invalid credentials" do
      it "returns 401 for wrong password" do
        post "/api/users/sign_in", params: { user: { email: "user@example.com", password: "wrong" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it "returns 401 for unknown email" do
        post "/api/users/sign_in", params: { user: { email: "nobody@example.com", password: "password123" } }, as: :json

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/users/sign_out" do
    let!(:user) { create(:user) }
    let(:token) do
      post "/api/users/sign_in", params: { user: { email: user.email, password: "password123" } }, as: :json
      response.headers["Authorization"]
    end

    it "returns 200 and signs out" do
      delete "/api/users/sign_out", headers: { "Authorization" => token }, as: :json

      expect(response).to have_http_status(:ok)
      expect(json["message"]).to eq("Signed out successfully")
    end

    it "blacklists the JWT so it cannot be reused" do
      delete "/api/users/sign_out", headers: { "Authorization" => token }, as: :json
      expect(JwtBlacklist.count).to eq(1)
    end
  end

  def json
    JSON.parse(response.body)
  end
end
