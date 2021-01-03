class RawFilesController < ApplicationController
  # protect_from_forgery :only => [:update, :destroy, :create]
    def index
      path = Base64.decode64(params[:path])
      absPath = File.join Rails.root, 'data', path
      send_file absPath
    end

    def public
      path = Base64.decode64(params[:path])
      absPath = File.join '/data', path
      redirect_to absPath
    end

    def viz_file
      path = File.join Rails.root, 'data', "static_viz_data", params[:name] + ".csv"
      send_file path
    end
  

    def demo
      path = File.join Rails.root, 'data/demo', params[:path]
      send_file path
    end

    def uploads
      path = File.join Rails.root, 'data/uploads', params[:path]
      send_file path
    end

  end
  