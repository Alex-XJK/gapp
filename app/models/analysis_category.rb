class AnalysisCategory < ApplicationRecord
    has_many :analyses

    def self.import(file)
        CSV.foreach(file.path, headers: true, encoding: 'bom|utf-8') do |row|
          ac = find_by_name(row['name'])|| new
          ac.attributes = row.to_hash.slice(*column_names)
          ac.save!
        end
    end
end
