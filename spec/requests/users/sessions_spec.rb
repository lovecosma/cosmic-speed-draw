require "rails_helper"

RSpec.describe "Users::SessionsController", type: :request do
  describe "POST /api/users/sign_in" do
    let!(:user) { create(:user) }

    context "with valid credentials" do
      before do
        post "/api/users/sign_in",
          params: { user: { email: user.email, password: user.password } },
          as: :json
      end

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "returns provisional: false" do
        expect(response.parsed_body.dig("user", "provisional")).to be false
      end

      it "returns the user id" do
        expect(response.parsed_body.dig("user", "id")).to eq(user.id)
      end

      it "sets the jwt_token cookie" do
        expect(response.cookies["jwt_token"]).to be_present
      end

      it "sets the refresh_token cookie" do
        expect(response.cookies["refresh_token"]).to be_present
      end
    end

    context "with invalid credentials" do
      before do
        post "/api/users/sign_in",
          params: { user: { email: user.email, password: "wrong" } },
          as: :json
      end

      it "returns 401" do
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "with a provisional session" do
      let!(:provisional_user) { create(:provisional_user) }
      let(:provisional_jwt) { JwtService.encode_provisional(provisional_user.id) }
      let!(:drawing) { create(:drawing, :provisional, provisional_user: provisional_user) }

      subject(:sign_in_request) do
        post "/api/users/sign_in",
          params: { user: { email: user.email, password: user.password } },
          headers: { "Cookie" => "jwt_token=#{provisional_jwt}" },
          as: :json
      end

      it "blacklists the provisional JWT" do
        sign_in_request
        expect(JwtService.decode(provisional_jwt)).to be_nil
      end

      it "reassigns drawings to the signed-in user" do
        sign_in_request
        expect(drawing.reload.user_id).to eq(user.id)
      end

      it "clears the provisional_user_id on reassigned drawings" do
        sign_in_request
        expect(drawing.reload.provisional_user_id).to be_nil
      end

      it "destroys the provisional user" do
        sign_in_request
        expect(ProvisionalUser.exists?(provisional_user.id)).to be false
      end
    end
  end

  describe "DELETE /api/users/sign_out" do
    context "with no active session" do
      it "returns 401" do
        delete "/api/users/sign_out", as: :json
        expect(response).to have_http_status(:unauthorized)
      end

      it "returns a no active session message" do
        delete "/api/users/sign_out", as: :json
        expect(response.parsed_body["message"]).to eq("No active session")
      end
    end
  end
end
