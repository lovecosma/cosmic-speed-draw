require "rails_helper"

RSpec.describe "Users::SessionsController", type: :request do
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
