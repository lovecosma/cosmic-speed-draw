require "rails_helper"

RSpec.describe "Auth", type: :request do
  describe "POST /api/users (sign up)" do
    let(:valid_params) do
      { user: { email: "new@example.com", password: "password123", password_confirmation: "password123" } }
    end

    context "with valid params" do
      before { post "/api/users", params: valid_params, as: :json }

      it "returns 201" do
        expect(response).to have_http_status(:created)
      end

      it "returns the user email" do
        expect(json["user"]["email"]).to eq("new@example.com")
      end

      it "does not return the password" do
        expect(json["user"]).not_to have_key("password")
      end
    end

    it "creates a user" do
      expect {
        post "/api/users", params: valid_params, as: :json
      }.to change(User, :count).by(1)
    end

    context "with invalid params" do
      it "returns 422 when email is taken" do
        create(:user, email: "new@example.com")
        post "/api/users", params: valid_params, as: :json

        expect(response).to have_http_status(:unprocessable_content)
      end

      it "returns the validation error when email is taken" do
        create(:user, email: "new@example.com")
        post "/api/users", params: valid_params, as: :json

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
      before { post "/api/users/sign_in", params: { user: { email: "user@example.com", password: "password123" } }, as: :json }

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the user email" do
        expect(json["user"]["email"]).to eq("user@example.com")
      end

      it "sets the jwt_token cookie" do
        expect(response.cookies["jwt_token"]).to be_present
      end

      it "strips the Authorization header from the response" do
        expect(response.headers["Authorization"]).to be_blank
      end

      it "sets the jwt_token cookie as HttpOnly" do
        expect(Array(response.headers["Set-Cookie"])).to include(a_string_including("httponly"))
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

    before do
      post "/api/users/sign_in", params: { user: { email: user.email, password: "password123" } }, as: :json
    end

    context "when signed in" do
      before { delete "/api/users/sign_out", as: :json }

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "returns a signed out message" do
        expect(json["message"]).to eq("Signed out successfully")
      end

      it "clears the jwt_token cookie" do
        expect(Array(response.headers["Set-Cookie"])).to include(a_string_including("jwt_token=;"))
      end
    end

    it "blacklists the JWT so it cannot be reused" do
      expect {
        delete "/api/users/sign_out", as: :json
      }.to change(JwtBlacklist, :count).by(1)
    end
  end

  def json
    response.parsed_body
  end
end
