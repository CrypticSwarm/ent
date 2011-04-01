Data Reporter 
===============

Aggregates data into reports.


# Report

Reports are told how to aggregate the data and are fed JS Objects. The report then walks down the report object based on the input path of the col.

# LogParser

LogParser parses highwinds cdn log format.

# Example

Code:
	logParser.readDirectory(directory, aggregatingReport('views by link', '{x-sname}'))

Output:
	views by link
		fls/121-blah-alaala
			views by link: 973005
		fls/1521-dwaala
			views by link: 9005
		fls/1817-anotherstream
			views by link: 19211


Code:
	logParser.readDirectory(directory, aggregatingReport('views per day', '{date}.{x-sname}'))

Output:
	views per day
		2010-10-08
			fls/121-blah-alaala
				views by link: 200003
			fls/1521-dwaala
				views by link: 4503
			fls/1817-anotherstream
				views by link: 7210
		2010-10-09
			fls/121-blah-alaala
				views by link: 773002
			fls/1521-dwaala
				views by link: 4502
			fls/1817-anotherstream
				views by link: 12001
