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
  
  end
  