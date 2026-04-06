require "rails_helper"

RSpec.describe AuthSessionService do
  let(:request) { ActionDispatch::TestRequest.create }
  let(:response) { instance_double(ActionDispatch::Response, set_cookie: nil, delete_cookie: nil) }

  subject(:service) { described_class.new(request:, response:) }

  describe "#issue_for" do
    let(:user) { create(:user) }

    it "sets a JWT cookie for the user" do
      expect(response).to receive(:set_cookie).with(
        "jwt_token",
        hash_including(
          value: satisfy { |token| JwtService.decode(token)&.fetch("sub", nil) == user.id.to_s },
          httponly: true,
          same_site: :lax,
          path: "/"
        )
      )

      service.issue_for(user)
    end

    it "creates and sets a refresh token cookie" do
      expect {
        service.issue_for(user)
      }.to change(RefreshToken, :count).by(1)

      refresh_token = RefreshToken.order(:created_at).last

      expect(response).to have_received(:set_cookie).with(
        RefreshToken::COOKIE_NAME,
        hash_including(
          value: refresh_token.token,
          expires: refresh_token.expires_at,
          httponly: true,
          same_site: :lax,
          path: "/"
        )
      )
    end
  end

  describe "#issue_for_provisional" do
    let(:provisional_user) { create(:provisional_user) }

    it "sets a provisional JWT cookie" do
      expect(response).to receive(:set_cookie).with(
        "jwt_token",
        hash_including(
          value: satisfy do |token|
            payload = JwtService.decode(token)
            payload&.fetch("sub", nil) == provisional_user.id.to_s && payload["type"] == "provisional"
          end,
          httponly: true,
          same_site: :lax,
          path: "/"
        )
      )

      service.issue_for_provisional(provisional_user)
    end

    it "does not create a refresh token" do
      expect {
        service.issue_for_provisional(provisional_user)
      }.not_to change(RefreshToken, :count)
    end
  end

  describe "#rotate_from_refresh_cookie" do
    let(:user) { create(:user) }

    context "with an active refresh token cookie" do
      let!(:refresh_token) { RefreshToken.generate_for(user) }

      before do
        request.cookies[RefreshToken::COOKIE_NAME] = refresh_token.token
      end

      it "returns the user" do
        expect(service.rotate_from_refresh_cookie).to eq(user)
      end

      it "revokes the current refresh token and issues a new one" do
        expect {
          service.rotate_from_refresh_cookie
        }.to change(RefreshToken, :count).by(1)

        expect(refresh_token.reload.revoked_at).to be_present
        expect(response).to have_received(:set_cookie).with("jwt_token", hash_including(:value))
        expect(response).to have_received(:set_cookie).with(
          RefreshToken::COOKIE_NAME,
          hash_including(value: RefreshToken.order(:created_at).last.token)
        )
      end
    end

    context "without a refresh token cookie" do
      it "returns nil" do
        expect(service.rotate_from_refresh_cookie).to be_nil
      end
    end

    context "with a revoked refresh token" do
      let!(:refresh_token) { RefreshToken.generate_for(user) }

      before do
        refresh_token.revoke!
        request.cookies[RefreshToken::COOKIE_NAME] = refresh_token.token
      end

      it "returns nil" do
        expect(service.rotate_from_refresh_cookie).to be_nil
      end

      it "does not issue new cookies" do
        service.rotate_from_refresh_cookie

        expect(response).not_to have_received(:set_cookie)
      end
    end
  end

  describe "#revoke_current_session" do
    let(:user) { create(:user) }

    context "with an authorization header and refresh cookie" do
      let(:jwt) { JwtService.encode(user.id) }
      let!(:refresh_token) { RefreshToken.generate_for(user) }

      before do
        request.headers["Authorization"] = "Bearer #{jwt}"
        request.cookies[RefreshToken::COOKIE_NAME] = refresh_token.token
      end

      it "returns true" do
        expect(service.revoke_current_session).to be true
      end

      it "blacklists the JWT and revokes the refresh token" do
        expect {
          service.revoke_current_session
        }.to change(JwtBlacklist, :count).by(1)

        expect(refresh_token.reload.revoked_at).to be_present
        expect(JwtService.decode(jwt)).to be_nil
      end

      it "clears both auth cookies" do
        service.revoke_current_session

        expect(response).to have_received(:delete_cookie).with("jwt_token", path: "/")
        expect(response).to have_received(:delete_cookie).with(RefreshToken::COOKIE_NAME, path: "/")
      end
    end

    context "without an authorization header" do
      it "returns false and still clears cookies" do
        expect(service.revoke_current_session).to be false
        expect(response).to have_received(:delete_cookie).with("jwt_token", path: "/")
        expect(response).to have_received(:delete_cookie).with(RefreshToken::COOKIE_NAME, path: "/")
      end
    end
  end
end
