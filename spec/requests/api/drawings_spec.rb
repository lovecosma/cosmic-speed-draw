require "rails_helper"

RSpec.describe "Api::DrawingsController", type: :request do
  let(:user) { create(:user) }
  let(:user_headers) { { "Authorization" => "Bearer #{JwtService.encode(user.id)}" } }

  let(:provisional_user) { create(:provisional_user) }
  let(:provisional_headers) { { "Authorization" => "Bearer #{JwtService.encode_provisional(provisional_user.id)}" } }

  let(:canvas_data_url) { "data:image/png;base64,abc123" }

  describe "GET /api/drawings" do
    context "without authentication" do
      it "returns 401" do
        get "/api/drawings", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "as a real user" do
      it "returns 200" do
        get "/api/drawings", headers: user_headers, as: :json
        expect(response).to have_http_status(:ok)
      end

      it "returns an empty array when the user has no drawings" do
        get "/api/drawings", headers: user_headers, as: :json
        expect(response.parsed_body).to eq([])
      end

      it "returns only drawings belonging to the current user" do
        create(:drawing, user:, canvas_data: { data_url: canvas_data_url })
        create(:drawing, user: create(:user), canvas_data: { data_url: canvas_data_url })

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body.length).to eq(1)
      end

      it "does not return drawings with no canvas_data" do
        create(:drawing, user:, canvas_data: nil)

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body).to eq([])
      end

      it "returns drawings ordered by updated_at descending" do
        older = create(:drawing, user:, canvas_data: { data_url: canvas_data_url })
        newer = create(:drawing, user:, canvas_data: { data_url: canvas_data_url })
        older.update_column(:updated_at, 1.day.ago)

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body.map { |d| d["id"] }).to eq([ newer.id, older.id ])
      end

      it "returns the drawing id" do
        drawing = create(:drawing, user:, canvas_data: { data_url: canvas_data_url })

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body.first["id"]).to eq(drawing.id)
      end

      it "returns the preview_url from canvas_data" do
        create(:drawing, user:, canvas_data: { data_url: canvas_data_url })

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body.first["preview_url"]).to eq(canvas_data_url)
      end

      it "returns updated_at for each drawing" do
        drawing = create(:drawing, user:, canvas_data: { data_url: canvas_data_url })

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body.first["updated_at"]).to be_present
      end

      it "does not return drawings belonging to provisional users" do
        create(:drawing, :provisional, canvas_data: { data_url: canvas_data_url })

        get "/api/drawings", headers: user_headers, as: :json

        expect(response.parsed_body).to eq([])
      end
    end

    context "as a provisional user" do
      it "returns 200" do
        get "/api/drawings", headers: provisional_headers, as: :json
        expect(response).to have_http_status(:ok)
      end

      it "returns only drawings belonging to the provisional user" do
        create(:drawing, :provisional, provisional_user:, canvas_data: { data_url: canvas_data_url })
        create(:drawing, user:, canvas_data: { data_url: canvas_data_url })

        get "/api/drawings", headers: provisional_headers, as: :json

        expect(response.parsed_body.length).to eq(1)
      end
    end
  end

  describe "POST /api/drawings" do
    context "without authentication" do
      it "returns 401" do
        post "/api/drawings", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "as a real user" do
      it "returns 201" do
        post "/api/drawings", headers: user_headers, as: :json
        expect(response).to have_http_status(:created)
      end

      it "returns the new drawing id" do
        post "/api/drawings", headers: user_headers, as: :json
        expect(response.parsed_body["id"]).to eq(Drawing.last.id)
      end

      it "creates a drawing belonging to the user" do
        expect {
          post "/api/drawings", headers: user_headers, as: :json
        }.to change { user.drawings.count }.by(1)
      end
    end

    context "as a provisional user" do
      it "returns 201" do
        post "/api/drawings", headers: provisional_headers, as: :json
        expect(response).to have_http_status(:created)
      end

      it "creates a drawing belonging to the provisional user" do
        expect {
          post "/api/drawings", headers: provisional_headers, as: :json
        }.to change { provisional_user.drawings.count }.by(1)
      end
    end
  end

  describe "GET /api/drawings/:id" do
    let(:drawing) { create(:drawing, user:) }

    context "without authentication" do
      it "returns 401" do
        get "/api/drawings/#{drawing.id}", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "as the owner" do
      it "returns 200" do
        get "/api/drawings/#{drawing.id}", headers: user_headers, as: :json
        expect(response).to have_http_status(:ok)
      end

      it "returns the drawing id" do
        get "/api/drawings/#{drawing.id}", headers: user_headers, as: :json
        expect(response.parsed_body["id"]).to eq(drawing.id)
      end

      it "returns canvas_data" do
        get "/api/drawings/#{drawing.id}", headers: user_headers, as: :json
        expect(response.parsed_body["canvas_data"]).to eq(drawing.canvas_data)
      end
    end

    context "when the drawing belongs to another user" do
      let(:other_drawing) { create(:drawing, user: create(:user)) }

      it "returns 404" do
        get "/api/drawings/#{other_drawing.id}", headers: user_headers, as: :json
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when the drawing does not exist" do
      it "returns 404" do
        get "/api/drawings/0", headers: user_headers, as: :json
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/drawings/:id" do
    let(:drawing) { create(:drawing, user:) }
    let(:valid_params) { { drawing: { canvas_data: canvas_data_url } } }

    context "without authentication" do
      it "returns 401" do
        patch "/api/drawings/#{drawing.id}", params: valid_params, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "as the owner with valid params" do
      before { patch "/api/drawings/#{drawing.id}", headers: user_headers, params: valid_params, as: :json }

      it "returns 200" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the drawing id" do
        expect(response.parsed_body["id"]).to eq(drawing.id)
      end

      it "returns the preview_url" do
        expect(response.parsed_body["preview_url"]).to eq(canvas_data_url)
      end

      it "returns updated_at" do
        expect(response.parsed_body["updated_at"]).to be_present
      end

      it "stores canvas_data as a data_url hash" do
        expect(drawing.reload.canvas_data).to eq({ "data_url" => canvas_data_url })
      end

      it "sets last_autosaved_at" do
        expect(drawing.reload.last_autosaved_at).to be_present
      end
    end

    context "without canvas_data" do
      it "returns 422" do
        patch "/api/drawings/#{drawing.id}", headers: user_headers, params: { drawing: {} }, as: :json
        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when the drawing belongs to another user" do
      let(:other_drawing) { create(:drawing, user: create(:user)) }

      it "returns 404" do
        patch "/api/drawings/#{other_drawing.id}", headers: user_headers, params: valid_params, as: :json
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/drawings/:id" do
    let!(:drawing) { create(:drawing, user:) }

    context "without authentication" do
      it "returns 401" do
        delete "/api/drawings/#{drawing.id}", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "as the owner" do
      it "returns 204" do
        delete "/api/drawings/#{drawing.id}", headers: user_headers, as: :json
        expect(response).to have_http_status(:no_content)
      end

      it "destroys the drawing" do
        expect {
          delete "/api/drawings/#{drawing.id}", headers: user_headers, as: :json
        }.to change(Drawing, :count).by(-1)
      end
    end

    context "when the drawing belongs to another user" do
      let!(:other_drawing) { create(:drawing, user: create(:user)) }

      it "returns 404" do
        delete "/api/drawings/#{other_drawing.id}", headers: user_headers, as: :json
        expect(response).to have_http_status(:not_found)
      end

      it "does not destroy the drawing" do
        expect {
          delete "/api/drawings/#{other_drawing.id}", headers: user_headers, as: :json
        }.not_to change(Drawing, :count)
      end
    end

    context "when the drawing does not exist" do
      it "returns 404" do
        delete "/api/drawings/0", headers: user_headers, as: :json
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
