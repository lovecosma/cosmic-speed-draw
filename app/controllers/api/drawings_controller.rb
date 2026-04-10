class Api::DrawingsController < ApplicationController
  include SessionOwner

  def index
    drawings = Drawing.where(**owner_scope).where.not(canvas_data: nil).order(updated_at: :desc)
    render json: drawings.map { |d|
      { id: d.id, preview_url: d.canvas_data&.dig("data_url"), updated_at: d.updated_at }
    }
  end

  def create
    drawing = Drawing.create!(**owner_scope)
    render json: { id: drawing.id }, status: :created
  end

  def show
    drawing = Drawing.find_by!(id: params[:id], **owner_scope)
    render json: { id: drawing.id, canvas_data: drawing.canvas_data }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end

  def destroy
    drawing = Drawing.find_by!(id: params[:id], **owner_scope)
    drawing.destroy!
    head :no_content
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end

  def update
    drawing = Drawing.find_by!(id: params[:id], **owner_scope)
    canvas_data = params.dig(:drawing, :canvas_data)
    return render json: { error: "canvas_data is required" }, status: :unprocessable_entity if canvas_data.blank?

    drawing.update!(canvas_data: { data_url: canvas_data }, last_autosaved_at: Time.current)
    render json: { id: drawing.id, preview_url: drawing.canvas_data["data_url"], updated_at: drawing.updated_at }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Not found" }, status: :not_found
  end
end
